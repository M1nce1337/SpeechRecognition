from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Text

from .base import Base


class LLMResponse(Base):
    __tablename__ = "llm_response"

    complaints: Mapped[str] = mapped_column(Text, nullable=False)
    anamnesis_vitae: Mapped[str] = mapped_column(Text, nullable=False)
    anamnesis_morbi: Mapped[str] = mapped_column(Text, nullable=False)