from rapidfuzz import process, fuzz
import core.mappings.lor_adult_mapping as mapping
import re


class LorNormalizer:
    @staticmethod
    def normalize(data: dict) -> dict:
        if not isinstance(data, dict):
            return data

        result = data.copy()  # Не мутируем исходный словарь

        for field in ["complaints", "anamnesis", "life_anamnesis", "recommendations", "diagnosis"]:
            if field not in result:
                continue
            value = result.get(field, "")
            if not isinstance(value, str) or not value.strip():
                continue

            result[field] = LorNormalizer._normalize_field(value.strip(), field)

        return result

    @staticmethod
    def _normalize_field(text: str, field: str) -> str:
        if not text or text == "...":
            return text

        # Выбираем нужный словарь
        if field == "complaints":
            term_dict = getattr(mapping, "LOR_COMPLAINTS", {})
        elif field == "anamnesis":
            term_dict = getattr(mapping, "LOR_ANAMNESIS", {})
        elif field == "life_anamnesis":
            term_dict = getattr(mapping, "LOR_LIFE_ANAMNESIS", {})
        elif field == "recommendations":
            term_dict = getattr(mapping, "LOR_RECOMMENDATIONS", {})
        else:
            return text

        # Разбиваем текст на отдельные фразы
        phrases = re.split(r'[,.]|\s+и\s+|\s+а\s+|\s+но\s+', text)
        phrases = [p.strip() for p in phrases if p.strip()]

        # Строим словарь для поиска
        all_terms = {}

        for canonical, variants in term_dict.items():
            all_terms[canonical.lower()] = canonical
            if isinstance(variants, list):
                for v in variants:
                    all_terms[v.lower()] = canonical
            elif isinstance(variants, dict):
                # Для вложенных словарей
                for subcat, subvariants in variants.items():
                    if isinstance(subvariants, list):
                        for v in subvariants:
                            all_terms[v.lower()] = f"{canonical} ({subcat})"

        # Нормализуем каждую фразу отдельно
        normalized_phrases = []

        for phrase in phrases:
            phrase_lower = phrase.lower()

            # Сначала проверяем точные совпадения
            if phrase_lower in all_terms:
                normalized_phrases.append(all_terms[phrase_lower])
                continue

            # Если точного нет, ищем лучшее нечеткое совпадение
            best = process.extractOne(
                phrase_lower,
                list(all_terms.keys()),
                scorer=fuzz.WRatio,
                score_cutoff=75
            )

            if best:
                matched = best[0]
                normalized_phrases.append(all_terms[matched])
            else:
                # Если ничего не нашли, оставляем как есть
                normalized_phrases.append(phrase)

        # Собираем результат
        result = ", ".join(normalized_phrases)

        # Убираем дубликаты
        unique_terms = []
        seen = set()
        for term in result.split(", "):
            if term not in seen:
                unique_terms.append(term)
                seen.add(term)

        return ", ".join(unique_terms)