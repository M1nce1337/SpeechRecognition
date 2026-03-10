from dataclasses import dataclass

@dataclass
class AnswerDTO:
    complaints: str
    anamnesis_vitae: str
    anamnesis_morbi: str