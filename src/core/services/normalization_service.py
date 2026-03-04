from docx import Document
from rapidfuzz import fuzz
from steosmorphy import MorphAnalyzer
import re

class NormalizationService:
    _DICT_PATH = "core/dictionary/dictionary.docx"

    def __init__(self):
        self._similarity_threshold = 50
        self._dict = Document(self._DICT_PATH) # загружаем файл со словарём терминов
        self._terms = [p.text.strip() for p in self._dict.paragraphs if p.text.strip()]
        self._morph = MorphAnalyzer()

    def lemmatize(self, text: str) -> str:
        """
        Приводит слова к нормальной форме 
        """
        final_text = ""
        lemmatized_words = [self._morph.analyze(word).first.lemma for word in text.split(" ")]
        
        for word in lemmatized_words:
            final_text += word + " "

        return final_text
    
    def normalize(self, text: str) -> str:
        """
        Нормализует текст на основе
        нечёткого сопоставления фраз из
        исходного текста и терминов из словаря
        """
        final_text = ""
        lemmatized_text = self.lemmatize(text)
        phrases = re.split(r'[,.]|\s+и\s+|\s+а\s+|\s+но\s+', lemmatized_text)
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
