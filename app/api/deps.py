from typing import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.security import ALGORITHM
from app.config import settings
from app.database.models import User
from app.database.session import async_session_factory

bearer_scheme = HTTPBearer(auto_error=False)

__all__ = ["get_db", "get_current_user", "ALGORITHM", "bearer_scheme"]


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session, committing on success and rolling back on error."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Resolve the authenticated user from the ``Authorization: Bearer`` header."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None or not credentials.credentials:
        raise credentials_exception

    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=[ALGORITHM])
    except JWTError:
        raise credentials_exception

    # Current tokens carry the internal user id in "uid".
    uid = payload.get("uid")
    if uid is not None:
        user = await db.get(User, int(uid))
    else:
        # Legacy tokens (pre-web-platform) stored the Telegram id in "sub".
        sub = payload.get("sub")
        if sub is None:
            raise credentials_exception
        try:
            result = await db.execute(select(User).where(User.telegram_id == int(sub)))
            user = result.scalar_one_or_none()
        except (ValueError, TypeError):
            raise credentials_exception

    if user is None:
        raise credentials_exception
    return user
