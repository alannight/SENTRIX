"""FastAPI application factory and ASGI entry point."""

import json
from collections.abc import Awaitable, Callable
from contextlib import asynccontextmanager
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, sessionmaker

from sentrix.api.routes import events, health
from sentrix.core.config import Settings, get_settings
from sentrix.core.logging import configure_logging
from sentrix.db.session import create_session_factory


class RequestSizeLimitMiddleware:
    """Buffer and cap request bodies before JSON validation reads them."""

    def __init__(self, app: Any, max_bytes: int) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(
        self,
        scope: dict,
        receive: Callable[[], Awaitable[dict]],
        send: Callable[[dict], Awaitable[None]],
    ) -> None:
        if scope["type"] != "http" or scope.get("method") not in {"POST", "PUT", "PATCH"}:
            await self.app(scope, receive, send)
            return
        body = bytearray()
        more_body = True
        while more_body:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            body.extend(message.get("body", b""))
            more_body = message.get("more_body", False)
            if len(body) > self.max_bytes:
                response = JSONResponse(
                    status_code=413, content={"detail": "Request body exceeds the allowed size"}
                )
                await response(scope, receive, send)
                return
        sent = False
        try:
            original_payload = json.loads(bytes(body))
            if isinstance(original_payload, dict):
                scope.setdefault("state", {})["original_payload"] = original_payload
        except (json.JSONDecodeError, UnicodeDecodeError):
            pass

        async def replay() -> dict:
            nonlocal sent
            if not sent:
                sent = True
                return {"type": "http.request", "body": bytes(body), "more_body": False}
            return {"type": "http.disconnect"}

        await self.app(scope, replay, send)


class RequestIdMiddleware:
    """Attach a server-generated request ID to ASGI state and the response."""

    def __init__(self, app: Any) -> None:
        self.app = app

    async def __call__(self, scope: dict, receive: Callable, send: Callable) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        request_id = str(uuid4())
        scope.setdefault("state", {})["request_id"] = request_id

        async def send_with_request_id(message: dict) -> None:
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append((b"x-request-id", request_id.encode("ascii")))
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_with_request_id)


def create_app(
    settings: Settings | None = None,
    engine_override: Any = None,
    session_factory_override: sessionmaker[Session] | None = None,
) -> FastAPI:
    settings = settings or get_settings()
    configure_logging()
    if engine_override is not None:
        engine = engine_override
        session_factory = session_factory_override
    else:
        engine, session_factory = create_session_factory(
            settings.database_url,
            pool_size=settings.db_pool_size,
            max_overflow=settings.db_max_overflow,
            pool_timeout_seconds=settings.db_pool_timeout_seconds,
        )
    if session_factory is None:
        raise ValueError("A session factory is required when overriding the database engine")

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        yield
        engine.dispose()

    app = FastAPI(
        title="SENTRIX API",
        version="0.1.0",
        description="Traceable security event ingestion and investigation API.",
        openapi_url="/api/v1/openapi.json",
        docs_url="/api/v1/docs",
        redoc_url=None,
        lifespan=lifespan,
    )
    app.state.engine = engine
    app.state.session_factory = session_factory
    app.add_middleware(RequestSizeLimitMiddleware, max_bytes=settings.max_request_bytes)
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
    )

    @app.exception_handler(RequestValidationError)
    async def safe_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        errors = [
            {
                "loc": error.get("loc", []),
                "msg": error.get("msg", "Invalid value"),
                "type": error.get("type", "value_error"),
            }
            for error in exc.errors()
        ]
        return JSONResponse(status_code=422, content={"detail": errors})

    app.include_router(health.router, prefix="/api/v1")
    app.include_router(events.router, prefix="/api/v1")
    return app


app = create_app()
