from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from core.services.document_service import document_service
import asyncio

router = APIRouter()

@router.post("/document/download")
async def download_document(request: dict) -> StreamingResponse:
    llm_response = request.get("result", {})
    document = await asyncio.to_thread(document_service.create_document, llm_response)

    return document     