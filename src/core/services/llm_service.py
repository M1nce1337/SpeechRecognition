from aiohttp import ClientSession
from core.config import settings
from application.dto import AnswerDTO
import json

class LLMService:
    def __init__(self):
        self._SYSTEM_PROMPT = settings.prompt.content
        self._api_url = settings.llm.url
        self._model = "qwen3-vl-30b"
        self._temperature = 0.2
        self._max_tokens = -1


    async def send_message(self, session: ClientSession, message: str) -> AnswerDTO:
        """
        Метод для отправления промпта и получения ответа
        """

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
            headers=headers) as response:

            raw = await response.json()
            result = json.loads(raw['choices'][0]['message']['content'])

            return AnswerDTO(
                complaints=result.get("complaints"),
                anamnesis_vitae=result.get("anamnesis_vitae"),
                anamnesis_morbi=result.get("anamnesis_morbi")
            )

llm_service = LLMService()        