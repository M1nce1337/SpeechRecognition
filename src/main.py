from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from api import main_router
import uvicorn
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent

# Жизненный цикл приложения (упрощенный, без БД)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    logger.info("🚀 Starting VoiceDoc application...")
    yield
    # shutdown
    logger.info("👋 Shutting down VoiceDoc application...")


templates = Jinja2Templates(directory="templates")


app = FastAPI(
    title="VoiceDoc",
    description="Medical voice documentation system",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(main_router)

app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR / "static"),
    name="static"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )