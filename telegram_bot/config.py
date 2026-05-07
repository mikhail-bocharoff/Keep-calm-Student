from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class BotSettings(BaseSettings):
    app_name: str = Field("ОтдохнИИ", alias="APP_NAME")
    telegram_bot_token: str = Field("", alias="TELEGRAM_BOT_TOKEN")
    backend_url: str = Field("http://localhost:8000", alias="BACKEND_URL")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = BotSettings()
