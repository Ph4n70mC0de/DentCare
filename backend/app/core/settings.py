"""Application settings from environment variables.

No secrets are ever logged. Values are sourced from the environment only.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "dentcare-api"
    environment: str = "development"
    debug: bool = False

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str | None = None
    supabase_jwt_secret: str | None = None

    # Database (transaction-mode pooler for serverless)
    database_url: str

    # FastAPI-for-frontend session broker (per ADR-001)
    session_secret: str
    session_cookie_name: str = "dentcare_session"
    session_cookie_secure: bool = True
    session_cookie_samesite: str = "lax"
    session_ttl_seconds: int = 60 * 60 * 8  # 8 hours

    # CORS / trusted origins (exact frontend origins per environment)
    cors_origins: str = ""

    # Rate limiting
    rate_limit_login: str = "10/minute"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
