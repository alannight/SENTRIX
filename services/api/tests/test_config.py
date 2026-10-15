import pytest
from pydantic import ValidationError

from sentrix.core.config import Settings


def test_production_configuration_requires_remote_postgres_and_https_origins():
    settings = Settings(
        database_url="postgresql+psycopg://test-user:placeholder@db.example.test/sentrix",
        app_env="production",
        cors_origins=["https://sentrix.example.test"],
    )
    assert settings.app_env == "production"

    with pytest.raises(ValidationError):
        Settings(
            database_url="postgresql+psycopg://test-user:placeholder@localhost/sentrix",
            app_env="production",
            cors_origins=["https://sentrix.example.test"],
        )

    with pytest.raises(ValidationError):
        Settings(
            database_url="postgresql+psycopg://test-user:placeholder@db.example.test/sentrix",
            app_env="production",
            cors_origins=["http://sentrix.example.test"],
        )


def test_wildcard_cors_is_rejected():
    with pytest.raises(ValidationError):
        Settings(database_url="sqlite://", cors_origins=["*"])


def test_comma_separated_origins_load_from_environment(monkeypatch):
    monkeypatch.setenv(
        "SENTRIX_CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
    settings = Settings(database_url="sqlite://", _env_file=None)
    assert settings.cors_origins == [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
