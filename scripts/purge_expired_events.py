"""Preview or apply the configured event retention policy."""

import argparse
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, func, select

from sentrix.core.config import get_settings
from sentrix.db.session import create_session_factory
from sentrix.events.models import SecurityEvent


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="delete matching event rows (default is a read-only preview)",
    )
    parser.add_argument(
        "--older-than-days",
        type=int,
        help="override SENTRIX_EVENT_RETENTION_DAYS for this invocation",
    )
    args = parser.parse_args()
    settings = get_settings()
    days = (
        settings.event_retention_days
        if args.older_than_days is None
        else args.older_than_days
    )
    if days <= 0:
        parser.error("set SENTRIX_EVENT_RETENTION_DAYS or pass --older-than-days greater than zero")

    cutoff = datetime.now(UTC) - timedelta(days=days)
    engine, factory = create_session_factory(
        settings.database_url,
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        pool_timeout_seconds=settings.db_pool_timeout_seconds,
    )
    try:
        with factory.begin() as session:
            count = session.scalar(
                select(func.count())
                .select_from(SecurityEvent)
                .where(SecurityEvent.created_at < cutoff)
            ) or 0
            if args.apply and count:
                session.execute(delete(SecurityEvent).where(SecurityEvent.created_at < cutoff))
        mode = "deleted" if args.apply else "would delete"
        print(f"{mode} {count} event(s) older than {days} days (cutoff {cutoff.isoformat()})")
    finally:
        engine.dispose()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
