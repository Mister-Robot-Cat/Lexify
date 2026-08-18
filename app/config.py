from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # Telegram (optional — the web API runs without it)
    telegram_bot_token: str = Field("", description="Telegram Bot API token")
    telegram_proxy_url: str | None = Field(None, description="Proxy URL for Telegram API (e.g. http://127.0.0.1:10808 or socks5://127.0.0.1:10808)")

    # Database
    database_url: str = Field(
        "mysql+aiomysql://root:123123@localhost:3306/lexify",
        description="Async MySQL connection string",
    )

    # Groq
    groq_api_key: str = Field(..., description="Groq API key")
    groq_model: str = Field("llama-3.1-8b-instant", description="Groq model name")

    # Redis / Caching
    redis_url: str = Field(
        "redis://localhost:6379/0",
        description="Redis connection string for caching"
    )
    cache_ttl_seconds: int = Field(
        86400,
        description="Cache TTL in seconds (default 24 hours)"
    )

    # App
    log_level: str = Field("INFO", description="Logging level")
    bot_mode: str = Field("polling", description="Bot mode: 'polling' or 'webhook'")
    webhook_url: str | None = Field(None, description="Webhook URL for production")
    webhook_secret: str | None = Field(
        None,
        description=(
            "Secret token sent to Telegram via set_webhook and checked against the "
            "X-Telegram-Bot-Api-Secret-Token header on every /webhook request. "
            "Without this, anyone who discovers the webhook URL can POST forged "
            "Update payloads impersonating any Telegram user. Required for BOT_MODE=webhook."
        ),
    )
    jwt_secret: str = Field("supersecretkeyforjwt", description="JWT secret key for Web API")

    # Web platform
    web_port: int = Field(8001, description="Port for the standalone web API (app.web)")
    cors_origins: str = Field(
        "http://localhost:3000,http://127.0.0.1:3000",
        description="Comma-separated list of allowed browser origins, or '*' for any",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """CORS origins parsed into the list format Starlette expects."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    # Shadowing — YouTube auto-fetch frequently gets IP-blocked from cloud/
    # datacenter hosts. Configuring a proxy works around it; see
    # https://github.com/jdepoix/youtube-transcript-api#working-around-ip-bans
    youtube_proxy_url: str | None = Field(
        None,
        description="Generic HTTP(S) proxy URL for YouTube transcript fetching (e.g. http://user:pass@host:port)",
    )
    webshare_proxy_username: str | None = Field(
        None, description="Webshare 'residential' proxy username, if using Webshare"
    )
    webshare_proxy_password: str | None = Field(
        None, description="Webshare 'residential' proxy password, if using Webshare"
    )

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
