from api.endpoints import router as asr_router
from fastapi import APIRouter


main_router = APIRouter()

main_router.include_router(asr_router)