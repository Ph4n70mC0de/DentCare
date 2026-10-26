"""Security helpers: password hashing, session token creation/validation.

Sensitive token material is never logged. Passwords are hashed with bcrypt.
"""

from datetime import UTC, datetime, timedelta
from typing import Any

from jose import jwt

from app.core.settings import settings


def hash_password(password: str) -> str:
    from passlib.context import CryptContext

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    from passlib.context import CryptContext

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.verify(plain, hashed)


def create_session_token(user_id: str, role: str) -> str:
    now = datetime.now(UTC)
    expires = now + timedelta(seconds=settings.session_ttl_seconds)
    payload: dict[str, Any] = {
        "sub": user_id,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expires.timestamp()),
    }
    return jwt.encode(payload, settings.session_secret, algorithm="HS256")


def decode_session_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.session_secret, algorithms=["HS256"])
