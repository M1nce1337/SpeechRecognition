import requests

class LLMService:
    
    # Параметры запроса к LLM
    _SYSTEM_PROMPT: str = "Ты - медицинский ассистент. На основе диалога врача и пациента сформируй JSON с полями: " \
                                 "complaints, anamnesis, status_praesens, recommendations"
    
    _api_url: str = "http://127.0.0.1:1234/v1/chat/completions"
    _model: str = "qwen3-vl-30b"
    _temperature = 0.2
    _max_tokens = -1

    # Метод класса для отправки промпта и получения ответа
    @classmethod
    def send_message(cls, message: str) -> dict:
        headers = {'Content-Type': 'application/json'}
        data = {
            "model": cls._model,
            "messages": [
                {"role": "system", "content": cls._SYSTEM_PROMPT},
                {"role": "user", "content": message}                               
            ],
            "temperature": cls._temperature,
            "max_tokens": cls._max_tokens,
            "stream": False
        }
        response = requests.post(cls._api_url, json=data, headers=headers)
        raw = response.json()

        return raw['choices'][0]['message']['content']