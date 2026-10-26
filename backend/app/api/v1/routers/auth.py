"""Auth router: login / logout / me (cookie-backed session per ADR-001)."""

from fastapi import APIRouter, Response

from app.core.security import create_session_token
from app.core.settings import settings
from app.db.session import get_connection
from app.schemas.auth import LoginRequest, LoginResponse, UserProfile

router = APIRouter(tags=["auth"])


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        path="/",
        max_age=settings.session_ttl_seconds,
    )


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, response: Response):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "select id, full_name, email, role from public.user_profiles where email = %s and status = 'active'",
                (payload.email,),
            )
            row = cur.fetchone()
    if not row:
        from app.core.exceptions import UnauthorizedError
        raise UnauthorizedError(message="Invalid credentials.")
    # NOTE: password verification requires a stored password hash column; placeholder until
    # the auth schema is extended. In production, verify against Supabase Auth instead.
    token = create_session_token(str(row[0]), row[3])
    _set_session_cookie(response, token)
    return LoginResponse(user={"id": str(row[0]), "email": row[2], "full_name": row[1], "role": row[3]})


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key=settings.session_cookie_name, path="/")
    return {"ok": True}


@router.get("/me", response_model=UserProfile)
async def me():
    # Resolved from session cookie by dependency in production; placeholder returns profile shape.
    return UserProfile(id="", email="", full_name="", role="patient")
