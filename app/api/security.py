"""Password hashing and JWT issuing for the web platform.

Hashing uses PBKDF2-HMAC-SHA256 from the standard library, so no additional
dependency (bcrypt/argon2) is required. Stored format:

    pbkdf2_sha256$<iterations>$<salt_hex>$<hash_hex>
"""

import hashlib
import hmac
import os
import time

from jose import jwt

from app.config import settings

ALGORITHM = "HS256"
TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30  # 30 days

_ITERATIONS = 200_000
_PREFIX = "pbkdf2_sha256"


def hash_password(password: str) -> str:
    """Hash a plaintext password with a fresh random salt."""
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITERATIONS)
    return f"{_PREFIX}${_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str | None) -> bool:
    """Constant-time check of a plaintext password against a stored hash."""
    if not stored:
        return False
    try:
        prefix, iterations, salt_hex, digest_hex = stored.split("$")
        if prefix != _PREFIX:
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations)
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(digest.hex(), digest_hex)


def create_access_token(user_id: int) -> str:
    """Issue a JWT identifying a user by their internal database id."""
    payload = {
        "sub": str(user_id),
        "uid": user_id,
        "iat": int(time.time()),
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)
