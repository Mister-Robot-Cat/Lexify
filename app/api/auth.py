import hashlib
import hmac
import json
import logging
from urllib.parse import parse_qsl

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.schemas import (
    LoginRequest,
    RegisterRequest,
    TelegramAuthData,
    Token,
    UserResponse,
)
from app.api.security import create_access_token, hash_password, verify_password
from app.config import settings
from app.database.models import User

logger = logging.getLogger(__name__)

router = APIRouter()


def validate_init_data(init_data: str, bot_token: str) -> dict | None:
    """Validate data received from a Telegram Web App (Mini App)."""
    if not init_data or not isinstance(init_data, str):
        return None
    try:
        parsed_data = dict(parse_qsl(init_data))
        if "hash" not in parsed_data:
            return None

        hash_val = parsed_data.pop("hash")
        data_check_string = "\n".join(
            f"{k}={v}" for k, v in sorted(parsed_data.items())
        )

        secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(
            secret_key, data_check_string.encode(), hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(calculated_hash, hash_val):
            return None

        return json.loads(parsed_data.get("user", "{}"))
    except Exception:
        return None


def serialize_user(user: User) -> dict:
    """Shape a User row for :class:`UserResponse`."""
    return {
        "id": user.id,
        "telegram_id": user.telegram_id,
        "email": user.email,
        "display_name": user.display_name,
        "name": user.name,
        "language": user.language,
        "ui_language": user.ui_language,
        "learning_language": user.learning_language,
        "daily_goal": user.daily_goal,
        "streak_days": user.streak_days,
        "created_at": user.created_at,
    }


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Create a new web account and return an access token."""
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        display_name=data.display_name or data.email.split("@")[0],
        language=data.language,
        learning_language=data.learning_language,
        ui_language=data.ui_language,
    )
    db.add(user)
    await db.flush()
    logger.info("Registered web user id=%d email=%s", user.id, user.email)

    return Token(access_token=create_access_token(user.id))


@router.post("/login", response_model=Token)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with email and password."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    return Token(access_token=create_access_token(user.id))


@router.post("/telegram", response_model=Token)
async def telegram_login(data: TelegramAuthData, db: AsyncSession = Depends(get_db)):
    """Authenticate via Telegram Mini App ``initData``.

    Existing bot users land straight in their account with all their words.
    """
    user_data = validate_init_data(data.initData, settings.telegram_bot_token)

    if not user_data or "id" not in user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram data",
        )

    telegram_id = int(user_data["id"])
    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            telegram_id=telegram_id,
            display_name=user_data.get("first_name") or None,
        )
        db.add(user)
        await db.flush()
    elif not user.display_name and user_data.get("first_name"):
        user.display_name = user_data["first_name"]

    return Token(access_token=create_access_token(user.id))


@router.post("/link-telegram", response_model=UserResponse)
async def link_telegram(
    data: TelegramAuthData,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Attach a Telegram account to the signed-in web account, so words added
    from the bot and from the website land in the same library."""
    user_data = validate_init_data(data.initData, settings.telegram_bot_token)
    if not user_data or "id" not in user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Telegram data"
        )

    telegram_id = int(user_data["id"])
    if current_user.telegram_id == telegram_id:
        return serialize_user(current_user)

    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    other = result.scalar_one_or_none()
    if other is not None and other.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This Telegram account is already linked to another Lexify profile",
        )

    current_user.telegram_id = telegram_id
    await db.flush()
    return serialize_user(current_user)
