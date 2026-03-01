from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from vosk import Model, KaldiRecognizer
from websocket_connection.connection_manager import manager
from core.services.llm_service import llm_service
import aiohttp
import base64
import json
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_PATH = "ml_models/vosk_new"
SAMPLE_RATE = 16000

router = APIRouter()

# Инициализация модели для распознавания речи
logger.info(f"Загрузка модели Vosk из {MODEL_PATH}...")
asr_model = Model(MODEL_PATH)
logger.info("Модель Vosk успешно загружена")


@router.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    logger.info("Новое WebSocket подключение")
    await manager.connect(websocket)

    # СОЗДАЕМ НОВЫЙ РАСПОЗНАВАТЕЛЬ ДЛЯ КАЖДОГО ПОДКЛЮЧЕНИЯ
    recognizer = KaldiRecognizer(asr_model, SAMPLE_RATE)
    full_text = ""  # Будем хранить текущий полный текст
    last_sent = ""  # Для предотвращения дубликатов (опционально)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "audio":
                pcm_data = base64.b64decode(message.get("data"))

                if recognizer.AcceptWaveform(pcm_data):
                    # Vosk возвращает ВЕСЬ накопленный текст
                    result = json.loads(recognizer.Result())
                    full_text = result.get("text", "").strip()

                    # Отправляем только если текст изменился
                    if full_text and full_text != last_sent:
                        last_sent = full_text
                        logger.info(f"📝 Текст: '{full_text}'")
                        await websocket.send_json({
                            "type": "final",
                            "text": full_text
                        })
                else:
                    # Частичный результат тоже содержит весь накопленный текст
                    partial = json.loads(recognizer.PartialResult())
                    preview = partial.get("partial", "").strip()

                    if preview and preview != full_text:
                        await websocket.send_json({
                            "type": "partial",
                            "text": preview
                        })

            elif message.get("type") == "eof":
                logger.info("Получен сигнал EOF")

                final = json.loads(recognizer.FinalResult())
                full_text = final.get("text", "").strip()

                if full_text:
                    await websocket.send_json({
                        "type": "final",
                        "text": full_text
                    })

                logger.info(f"🏁 Итоговый текст: '{full_text}'")
                break

    except WebSocketDisconnect:
        logger.info("Клиент отключился")
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Ошибка: {e}", exc_info=True)
    finally:
        logger.info("WebSocket соединение закрыто")


@router.post("/llm/structure")
async def llm_process(request: dict):
    """Обработка текста через LLM"""
    text = request.get("text", "")
    logger.info(f"Запрос к LLM с текстом: '{text[:100]}...'")

    if not text:
        return {"error": "No text provided"}

    try:
        async with aiohttp.ClientSession() as session:
            result = await llm_service.send_message(session, text)
            return result
    except Exception as e:
        logger.error(f"Ошибка LLM: {e}")
        return {"error": str(e)}