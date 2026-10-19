from pathlib import Path

from alembic import command
from alembic.config import Config
from sentrix.core.config import get_settings
from sqlalchemy import create_engine, inspect


def test_migrations_run_from_an_unrelated_working_directory(tmp_path, monkeypatch):
    database_url = f"sqlite:///{tmp_path / 'migration.db'}"
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("SENTRIX_APP_ENV", "test")
    get_settings.cache_clear()
    try:
        monkeypatch.chdir(tmp_path)
        api_root = Path(__file__).resolve().parents[1]
        config = Config(str(api_root / "alembic.ini"))

        command.upgrade(config, "head")

        engine = create_engine(database_url)
        try:
            inspector = inspect(engine)
            assert "security_events" in inspector.get_table_names()
            assert "event_audit_records" in inspector.get_table_names()
            assert "alembic_version" in inspector.get_table_names()
        finally:
            engine.dispose()
    finally:
        get_settings.cache_clear()
