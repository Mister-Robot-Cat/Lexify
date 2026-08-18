"""Standalone entry point for the Lexify web platform API.

``app.main`` boots the Telegram bot *and* the API. This module serves only the
web API, so the website can run without a Telegram token, without polling and
without the bot's job queue:

    python -m app.web
"""

import logging
import sys
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import settings
from app.database.session import close_db, init_db
from app.services.cache_service import cache_service

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

if settings.jwt_secret == "supersecretkeyforjwt":
    logger.warning(
        "JWT_SECRET is using the hardcoded default value — anyone can forge a "
        "valid auth token for ANY user with this well-known secret. Set "
        "JWT_SECRET in .env before exposing this API publicly."
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Lexify web API…")
    await init_db()
    yield
    await close_db()
    await cache_service.close()
    logger.info("Lexify web API stopped.")


app = FastAPI(
    title="Lexify Web API",
    description="Vocabulary, quizzes, AI tutor and IELTS evaluation for the Lexify website.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "lexify-web-api"}


if __name__ == "__main__":
    uvicorn.run(
        "app.web:app",
        host="0.0.0.0",
        port=settings.web_port,
        reload=False,
        log_level=settings.log_level.lower(),
    )
