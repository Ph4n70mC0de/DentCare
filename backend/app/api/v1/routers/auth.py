"""Auth router: login / logout / me (cookie-backed session per ADR-001)."""

from typing import Any

import httpx
from fastapi import APIRouter, Depends, Response

from app.core.deps import get_current_user
from app.core.exceptions import UnauthorizedError
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
    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/token?grant_type=password"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                url,
                headers={"apikey": settings.supabase_anon_key, "Content-Type": "application/json"},
                json={"email": payload.email, "password": payload.password},
            )
    except httpx.HTTPError as exc:
        raise UnauthorizedError(message="Auth provider unavailable.") from exc
    if res.status_code != 200:
        raise UnauthorizedError(message="Invalid credentials.")
    data: dict[str, Any] = res.json()
    user_id = data.get("user", {}).get("id")
    if not user_id:
        raise UnauthorizedError(message="Invalid credentials.")

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "select id, full_name, email, role from public.user_profiles where id = %s and status = 'active'",
                (user_id,),
            )
            row = cur.fetchone()
    if not row:
        raise UnauthorizedError(message="User profile not found.")

    token = create_session_token(str(row[0]), row[3])
    _set_session_cookie(response, token)
    return LoginResponse(user={"id": str(row[0]), "email": row[2], "full_name": row[1], "role": row[3]})


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key=settings.session_cookie_name, path="/")
    return {"ok": True}


@router.get("/me", response_model=UserProfile)
async def me(current_user: UserProfile = Depends(get_current_user)):
    return current_user
