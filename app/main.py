import logging
import sys
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from telegram import BotCommand, Update
from telegram.ext import Application

from app.bot.handlers import register_handlers
from app.bot.reminders import daily_review_reminder, word_of_the_day
from app.config import settings
from app.database.session import close_db, init_db
from app.api.router import api_router

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

# ─── Telegram Application (built once, shared) ───────────────────────────────

bot_app = (
    Application.builder()
    .token(settings.telegram_bot_token)
    .build()
)
register_handlers(bot_app)


# ─── FastAPI lifespan ─────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic for the FastAPI application."""
    # Startup
    logger.info("Starting Lexify bot…")
    await init_db()
    await bot_app.initialize()

    # Set bot command menu visible to users
    await bot_app.bot.set_my_commands([
        BotCommand("start", "👋 Welcome & instructions"),
        BotCommand("menu", "📋 Choose section (Words/Grammar/IELTS)"),
        BotCommand("quiz", "🎯 Practice your vocabulary"),
        BotCommand("library", "📚 View your word collection"),
        BotCommand("topics", "📦 Themed word packs"),
        BotCommand("ask", "❓ Grammar chatbot (new chat)"),
        BotCommand("clear", "🗑 Clear grammar chat history"),
        BotCommand("ielts", "📝 IELTS writing evaluation"),
        BotCommand("language", "🌍 Choose translation language"),
        BotCommand("learning", "📖 Choose language to learn"),
        BotCommand("ui", "🖥 Bot interface language"),
        BotCommand("delete", "🗑 Remove a word from library"),
        BotCommand("progress", "📊 See your learning stats"),
        BotCommand("cancel", "🚫 Cancel current quiz"),
    ])
    logger.info("Bot command menu set.")

    # Schedule daily review reminder (runs every 24 hours)
    bot_app.job_queue.run_repeating(
        daily_review_reminder,
        interval=86400,       # 24 hours in seconds
        first=10,             # first run 10 seconds after start
        name="daily_review_reminder",
    )
    # Schedule Word of the Day (runs every 24 hours, first run after 30 seconds)
    bot_app.job_queue.run_repeating(
        word_of_the_day,
        interval=86400,
        first=30,
        name="word_of_the_day",
    )
    logger.info("Daily jobs scheduled (reminder + word of the day).")

    if settings.bot_mode == "webhook":
        if not settings.webhook_url:
            raise ValueError("WEBHOOK_URL must be set when BOT_MODE=webhook")
        webhook_path = f"{settings.webhook_url}/webhook"
        await bot_app.bot.set_webhook(url=webhook_path)
        logger.info("Webhook set to %s", webhook_path)
        await bot_app.start()
    else:
        # Polling mode — start updater in the background
        await bot_app.start()
        await bot_app.updater.start_polling(drop_pending_updates=True)
        logger.info("Bot started in polling mode.")

    yield

    # Shutdown
    logger.info("Shutting down Lexify bot…")
    if settings.bot_mode == "polling" and bot_app.updater.running:
        await bot_app.updater.stop()
    await bot_app.stop()
    await bot_app.shutdown()
    await close_db()
    logger.info("Shutdown complete.")


# ─── FastAPI app ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Lexify — English Vocabulary Bot",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev, update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.post("/webhook")
async def telegram_webhook(request: Request) -> Response:
    """Receive Telegram updates via webhook (production mode)."""
    data = await request.json()
    update = Update.de_json(data, bot_app.bot)
    await bot_app.process_update(update)
    return Response(status_code=200)


@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "bot_mode": settings.bot_mode}


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level=settings.log_level.lower(),
    )
