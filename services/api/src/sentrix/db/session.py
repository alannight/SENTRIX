"""Database engine and request-scoped session helpers."""

from collections.abc import AsyncGenerator

from fastapi import Request
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker


def create_session_factory(database_url: str) -> tuple[Engine, sessionmaker[Session]]:
    kwargs = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    engine = create_engine(database_url, pool_pre_ping=True, connect_args=kwargs)
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    return engine, factory


async def get_session(request: Request) -> AsyncGenerator[Session, None]:
    with request.app.state.session_factory() as session:
        yield session
