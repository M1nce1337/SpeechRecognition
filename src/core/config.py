from pydantic import BaseModel, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import ClassVar

class SystemPromptConfig(BaseModel):
    content: str

class LLMConfig(BaseModel):
    url: str

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        env_nested_delimiter="__",
        env_prefix="APP_CONFIG__",
    )

    llm: LLMConfig
    prompt: SystemPromptConfig

settings = Settings()
