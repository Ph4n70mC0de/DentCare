"""FastAPI dependencies: current user resolution from session cookie."""

from fastapi import Depends, Request

from app.core.exceptions import UnauthorizedError
from app.core.security import decode_session_token
from app.core.settings import settings
from app.db.session import get_connection
from app.schemas.auth import UserProfile


def get_session_token(request: Request) -> str:
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        raise UnauthorizedError(message="Missing session.")
    return token


def get_current_user(token: str = Depends(get_session_token)) -> UserProfile:
    try:
        payload = decode_session_token(token)
    except Exception:  # noqa: BLE001
        raise UnauthorizedError(message="Invalid session.") from None
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError(message="Invalid session.")
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "select id, full_name, email, role from public.user_profiles where id = %s and status = 'active'",
                (user_id,),
            )
            row = cur.fetchone()
    if not row:
        raise UnauthorizedError(message="User not found.")
    return UserProfile(id=str(row[0]), email=row[2] or "", full_name=row[1], role=row[3])
