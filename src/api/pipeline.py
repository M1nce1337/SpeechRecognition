from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from vosk import Model, KaldiRecognizer
from websocket_connection.connection_manager import manager
from core.models.db_helper import db_helper
from core.services.asr_service import ASRService
from core.services.llm_service import llm_service
import aiohttp
import base64
import json


MODEL_PATH = "ml_models/vosk"
SAMPLE_RATE = 16000


router = APIRouter()

# Инициализация модели для распознавания речи
asr_model = Model(MODEL_PATH)
recognizer = KaldiRecognizer(asr_model, SAMPLE_RATE)

text = "" # здесь будем хранить распознанный текст


@router.websocket("/ws/audio")
async def websocket_endpoint(
    websocket: WebSocket,
    session: AsyncSession = Depends(db_helper.session_getter)
    ):

    global text
    
    await manager.connect(websocket)

    try:

     while True:
        data = await websocket.receive_text()
        message = json.loads(data)

        if message.get("type") == "audio":
            pcm_data = base64.b64decode(message.get("data"))
            ok = recognizer.AcceptWaveform(pcm_data)

            if ok:
                result = json.loads(recognizer.Result())
                text += result.get("text", "")
                
                await websocket.send_json({
                    "type": "final",
                    "text": text
                })

            else:
                partial = json.loads(recognizer.PartialResult())
                await websocket.send_json({
                    "type": "partial",
                    "text": partial.get("partial", "")
                })

        if message.get("type") == "eof":
            final = json.loads(recognizer.FinalResult())
            
            await ASRService.save_record(
                session=session,
                raw_text=text,
                final_text=final.get("text", "")
            )

            await websocket.send_json({
                "type": "final",
                "text": final.get("text", "")
            })

            break

    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.post("/llm/structure")
async def llm_process():
    async with aiohttp.ClientSession() as session:
        result = await llm_service.send_message(session, text)
        return result  