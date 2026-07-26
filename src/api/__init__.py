from api.stt import router as stt_router
from api.llm import router as llm_router
from api.document import router as document_router
from fastapi import APIRouter


main_router = APIRouter()

main_router.include_router(stt_router)
main_router.include_router(llm_router)
main_router.include_router(document_router)
