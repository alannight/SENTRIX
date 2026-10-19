"""Add append-only event ingestion audit records.

Revision ID: 0002_event_audit_records
Revises: 0001_security_events
Create Date: 2026-10-19
"""

import sqlalchemy as sa
from alembic import op

revision = "0002_event_audit_records"
down_revision = "0001_security_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "event_audit_records",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("event_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("actor", sa.String(length=100), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_event_audit_records_occurred_at", "event_audit_records", ["occurred_at"])


def downgrade() -> None:
    op.drop_index("ix_event_audit_records_occurred_at", table_name="event_audit_records")
    op.drop_table("event_audit_records")
