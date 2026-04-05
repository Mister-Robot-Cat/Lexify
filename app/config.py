from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # Telegram
    telegram_bot_token: str = Field(..., description="Telegram Bot API token")

    # Database
    database_url: str = Field(
        "mysql+aiomysql://root:123123@localhost:3306/lexify",
        description="Async MySQL connection string",
    )

    # Groq
    groq_api_key: str = Field(..., description="Groq API key")
    groq_model: str = Field("llama-3.3-70b-versatile", description="Groq model name")

    # App
    log_level: str = Field("INFO", description="Logging level")
    bot_mode: str = Field("polling", description="Bot mode: 'polling' or 'webhook'")
    webhook_url: str | None = Field(None, description="Webhook URL for production")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
