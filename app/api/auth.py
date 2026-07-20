import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.api.deps import get_db, ALGORITHM
from app.database.models import User

router = APIRouter()

class TelegramAuthData(BaseModel):
    initData: str

class Token(BaseModel):
    access_token: str
    token_type: str

def validate_init_data(init_data: str, bot_token: str) -> dict | None:
    """Validates data received from Telegram Web App."""
    try:
        parsed_data = dict(parse_qsl(init_data))
        if "hash" not in parsed_data:
            return None

        hash_val = parsed_data.pop("hash")
        
        # Sort alphabetically
        data_check_string = "\n".join(
            f"{k}={v}" for k, v in sorted(parsed_data.items())
        )
        
        secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if calculated_hash != hash_val:
            return None
            
        return json.loads(parsed_data.get("user", "{}"))
    except Exception:
        return None

@router.post("/login", response_model=Token)
async def login(data: TelegramAuthData, db: AsyncSession = Depends(get_db)):
    # Verify Telegram Web App initData
    user_data = validate_init_data(data.initData, settings.telegram_bot_token)
    
    # FOR DEVELOPMENT ONLY (allow raw telegram id if it's a number, or bypass)
    if not user_data and data.initData.isdigit():
        user_data = {"id": int(data.initData), "first_name": "Dev"}

    if not user_data or "id" not in user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram data"
        )
        
    telegram_id = user_data["id"]
    
    # Check if user exists, if not, create them
    stmt = select(User).where(User.telegram_id == telegram_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        user = User(telegram_id=telegram_id)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Generate JWT
    to_encode = {"sub": str(user.telegram_id), "exp": time.time() + 86400 * 7} # 7 days
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=ALGORITHM)
    
    return {"access_token": encoded_jwt, "token_type": "bearer"}
