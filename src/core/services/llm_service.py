from aiohttp import ClientSession

class LLMService:
    
    # Параметры запроса к LLM
    _SYSTEM_PROMPT: str = "Ты - медицинский ассистент. На основе диалога врача и пациента сформируй JSON с полями: " \
                                 "complaints, anamnesis, status_praesens, recommendations"
    
    _api_url: str = "http://127.0.0.1:1234/v1/chat/completions"
    _model: str = "qwen3-vl-30b"
    _temperature = 0.2
    _max_tokens = -1

    # Метод класса для отправки промпта и получения ответа
    
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