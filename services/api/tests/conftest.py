"""Isolated SQLite-backed API fixtures."""

import asyncio
import os
from collections.abc import Iterator

os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/sentrix-pytest-import.sqlite3")
os.environ.setdefault("SENTRIX_ENV", "test")

import httpx
import pytest
from sentrix.core.config import Settings
from sentrix.db.base import Base
from sentrix.events import models as _models  # noqa: F401
from sentrix.main import create_app
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


class ASGISyncClient:
    """Synchronous test helper over HTTPX ASGI transport (no server socket)."""

    def __init__(self, application) -> None:  # noqa: ANN001
        self.application = application
        self.transport = httpx.ASGITransport(app=application)

    def _request(self, method: str, path: str, **kwargs):  # noqa: ANN001, ANN201
        async def send():
            async with httpx.AsyncClient(
                transport=self.transport,
                base_url="http://testserver",
            ) as client:
                return await client.request(method, path, **kwargs)

        return asyncio.run(send())

    def get(self, path: str, **kwargs):  # noqa: ANN001, ANN201
        return self._request("GET", path, **kwargs)

    def post(self, path: str, **kwargs):  # noqa: ANN001, ANN201
        return self._request("POST", path, **kwargs)


@pytest.fixture
def client() -> Iterator[ASGISyncClient]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    settings = Settings(
        database_url="sqlite://",
        app_env="test",
        max_request_bytes=2_048,
    )
    application = create_app(settings, engine, factory)
    yield ASGISyncClient(application)
    engine.dispose()
