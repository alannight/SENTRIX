"""Create canonical security event storage.

Revision ID: 0001_security_events
Revises:
Create Date: 2026-10-15
"""

import sqlalchemy as sa
from alembic import op

revision = "0001_security_events"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "security_events",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("schema_version", sa.String(length=20), nullable=False),
        sa.Column("source", sa.String(length=200), nullable=False),
        sa.Column("event_type", sa.String(length=200), nullable=False),
        sa.Column("event_timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.Column("observed_timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ingested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("severity", sa.String(length=50), nullable=True),
        sa.Column("host", sa.String(length=500), nullable=True),
        sa.Column("user", sa.String(length=500), nullable=True),
        sa.Column("source_ip", sa.String(length=45), nullable=True),
        sa.Column("destination_ip", sa.String(length=45), nullable=True),
        sa.Column("process_name", sa.String(length=500), nullable=True),
        sa.Column("raw_event", sa.JSON(), nullable=False),
        sa.Column("normalized_fields", sa.JSON(), nullable=False),
        sa.Column("parser_name", sa.String(length=100), nullable=False),
        sa.Column("parser_version", sa.String(length=50), nullable=False),
        sa.Column("event_fingerprint", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_security_events_created_at_id", "security_events", ["created_at", "id"])
    op.create_index("ix_security_events_event_timestamp", "security_events", ["event_timestamp"])
    op.create_index("ix_security_events_event_type", "security_events", ["event_type"])
    op.create_index("ix_security_events_severity", "security_events", ["severity"])
    op.create_index("ix_security_events_source", "security_events", ["source"])


def downgrade() -> None:
    op.drop_index("ix_security_events_source", table_name="security_events")
    op.drop_index("ix_security_events_severity", table_name="security_events")
    op.drop_index("ix_security_events_event_type", table_name="security_events")
    op.drop_index("ix_security_events_event_timestamp", table_name="security_events")
    op.drop_index("ix_security_events_created_at_id", table_name="security_events")
    op.drop_table("security_events")
