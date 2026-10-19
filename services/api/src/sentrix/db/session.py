"""Database engine and request-scoped session helpers."""

from collections.abc import AsyncGenerator

from fastapi import Request
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker


def create_session_factory(
    database_url: str,
    *,
    pool_size: int = 5,
    max_overflow: int = 5,
    pool_timeout_seconds: int = 30,
) -> tuple[Engine, sessionmaker[Session]]:
    kwargs = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    pool_options = {} if database_url.startswith("sqlite") else {
        "pool_size": pool_size,
        "max_overflow": max_overflow,
        "pool_timeout": pool_timeout_seconds,
    }
    engine = create_engine(database_url, pool_pre_ping=True, connect_args=kwargs, **pool_options)
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    return engine, factory


async def get_session(request: Request) -> AsyncGenerator[Session, None]:
    with request.app.state.session_factory() as session:
        yield session
