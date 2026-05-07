from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field("ОтдохнИИ", alias="APP_NAME")
    app_env: str = Field("development", alias="APP_ENV")
    database_url: str = Field("sqlite:///./otdohnii.db", alias="DATABASE_URL")
    llm_mode: str = Field("mock", alias="LLM_MODE")
    llm_api_key: str = Field("", alias="LLM_API_KEY")
    llm_model_name: str = Field("", alias="LLM_MODEL_NAME")
    llm_base_url: str = Field("", alias="LLM_BASE_URL")
    local_model_path: str = Field("", alias="LOCAL_MODEL_PATH")
    telegram_bot_token: str = Field("", alias="TELEGRAM_BOT_TOKEN")
    frontend_url: str = Field("http://localhost:5173", alias="FRONTEND_URL")
    backend_url: str = Field("http://localhost:8000", alias="BACKEND_URL")

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
