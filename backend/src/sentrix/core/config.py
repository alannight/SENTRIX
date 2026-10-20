"""Validated application configuration."""

from functools import lru_cache
from urllib.parse import urlparse

from pydantic import AliasChoices, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

MAX_EVENT_RETENTION_DAYS = 36_500


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SENTRIX_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        hide_input_in_errors=True,
        enable_decoding=False,
        populate_by_name=True,
    )

    app_env: str = "development"
    database_url: str = Field(validation_alias=AliasChoices("DATABASE_URL", "database_url"))
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    max_request_bytes: int = Field(default=262_144, ge=1_024, le=2_097_152)
    db_pool_size: int = Field(default=5, ge=1, le=50)
    db_max_overflow: int = Field(default=5, ge=0, le=100)
    db_pool_timeout_seconds: int = Field(default=30, ge=1, le=300)
    event_retention_days: int = Field(default=0, ge=0, le=MAX_EVENT_RETENTION_DAYS)

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("app_env")
    @classmethod
    def validate_environment(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"development", "test", "production"}:
            raise ValueError("SENTRIX_APP_ENV must be development, test, or production")
        return normalized

    @model_validator(mode="after")
    def validate_security_configuration(self) -> "Settings":
        if not self.cors_origins or any(origin == "*" for origin in self.cors_origins):
            raise ValueError("CORS origins must be explicit; wildcard origins are not allowed")
        if self.app_env == "production":
            database_host = urlparse(self.database_url).hostname
            if not database_host or database_host in {"localhost", "127.0.0.1", "::1"}:
                raise ValueError("Production database configuration must use a non-local host")
            if not self.database_url.startswith("postgresql+psycopg://"):
                raise ValueError("Production database must use PostgreSQL with the psycopg driver")
            if any(not origin.startswith("https://") for origin in self.cors_origins):
                raise ValueError("Production CORS origins must use HTTPS")
        return self


@lru_cache
def get_settings() -> Settings:
    """Load settings once; required values fail at startup with validation details."""
    return Settings()
