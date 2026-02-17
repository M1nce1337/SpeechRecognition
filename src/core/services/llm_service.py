from aiohttp import ClientSession
from dotenv import load_dotenv
from core.config import settings
import os

class LLMService:

    # Параметры запроса к LLM
    _SYSTEM_PROMPT = settings.prompt.content
    _api_url = settings.llm.url
    _model = "qwen3-vl-30b"
    _temperature = 0.2
    _max_tokens = -1

    # Метод для отправки промпта и получения ответа
    
    async def send_message(self, session: ClientSession, message: str) -> dict:
        headers = {'Content-Type': 'application/json'}
        data = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": self._SYSTEM_PROMPT},
                {"role": "user", "content": message}                               
            ],
            "temperature": self._temperature,
            "max_tokens": self._max_tokens,
            "stream": False
        }

        async with session.post(
            self._api_url, 
            json=data, 
            headers=headers) as result:

            raw = await result.json()

            return raw['choices'][0]['message']['content']

llm_service = LLMService()        