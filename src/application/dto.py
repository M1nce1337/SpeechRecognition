from dataclasses import dataclass

@dataclass
class AnswerDTO:
    complaints: str
    anamnesis: str
    status_praesens: str
    recommendations: str