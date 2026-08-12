from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from core.services.document_service import document_service
from concurrent.futures import ProcessPoolExecutor, Future
import asyncio

router = APIRouter()

@router.post("/document/download")
async def download_document(request: dict) -> StreamingResponse:
    llm_response = request.get("result", {})

    with ProcessPoolExecutor() as executor:
        document = await asyncio.get_event_loop().run_in_executor(executor, document_service.create_document, llm_response)

    return document     