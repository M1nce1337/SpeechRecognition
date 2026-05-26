from docx import Document
from rapidfuzz import fuzz
import re

class NormalizationService:
    _DICT_PATH = "core/documents/dictionary.docx"

    def __init__(self):
        self._similarity_threshold = 50
        self._dict = Document(self._DICT_PATH) # загружаем файл со словарём терминов
        self._terms = [p.text.strip() for p in self._dict.paragraphs if p.text.strip()]

    
    def normalize(self, text: str) -> str:
        """
        Нормализует текст на основе
        нечёткого сопоставления фраз из
        исходного текста и терминов из словаря
        """
        final_text = ""
        phrases = re.split(r'[,.]|\s+и\s+|\s+а\s+|\s+но\s+', text)
        phrases = [phrase.strip().lower() for phrase in phrases if phrase.strip().lower()]

        for phrase in phrases:
            replaced = False

            for term in self._terms:
                score = fuzz.token_sort_ratio(phrase, term)

                if score >= self._similarity_threshold or phrase in self._terms:
                    final_text += term + " "
                    replaced = True
                    break

            if not replaced:
                final_text += phrase

        return final_text            
            

normalization_service = NormalizationService()
