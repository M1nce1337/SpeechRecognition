from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.models.db_helper import db_helper
from core.services.llm_service import llm_service
from core.services.normalization_service import normalization_service
from dataclasses import asdict
import aiohttp
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/llm/structure")
async def llm_process(request: dict, db_session: AsyncSession = Depends(db_helper.session_getter)):
    text = request.get("text", "")
    logger.info(f"Запрос к LLM с текстом: '{text[:100]}...'")

    if not text:
        return {"error": "No text provided"}
    
    normalized_text = normalization_service.normalize(text)

    logger.info(f"После нормализации: {normalized_text}")

    async with aiohttp.ClientSession() as session:
        llm_response = await llm_service.send_message(session, normalized_text)
        result = asdict(llm_response)

        await llm_service.save_response(
            session=db_session,
            complaints=result.get("complaints", ""),
            anamnesis_vitae=result.get("anamnesis_vitae", ""),
            anamnesis_morbi=result.get("anamnesis_morbi", "")
        )

        return result