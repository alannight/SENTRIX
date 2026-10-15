from datetime import UTC, datetime

from sentrix.events.schemas import fingerprint_for


def payload(**overrides):
    event = {
        "schema_version": "1.0",
        "source": "synthetic-linux-auth",
        "event_type": "authentication.success",
        "event_timestamp": "2026-01-02T03:04:05+07:00",
        "severity": "INFO",
        "host": "workstation-01",
        "user": "analyst",
        "source_ip": "192.0.2.10",
        "destination_ip": "2001:db8::20",
        "raw_vendor_field": {"auth_method": "password"},
    }
    event.update(overrides)
    return event


def test_health_reports_database_availability(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "available"}


def test_ingest_preserves_payload_and_normalizes_fields(client):
    submitted = payload()
    response = client.post("/api/v1/events", json=submitted)
    assert response.status_code == 201, response.text
    accepted = response.json()
    assert accepted["status"] == "persisted"
    event_id = accepted["id"]
    by_fingerprint = client.get(
        "/api/v1/events", params={"event_fingerprint": accepted["event_fingerprint"]}
    )
    assert by_fingerprint.status_code == 200
    assert by_fingerprint.json()["total"] == 1

    detail = client.get(f"/api/v1/events/{event_id}")
    assert detail.status_code == 200
    event = detail.json()
    assert event["raw_event"] == submitted
    assert event["source_ip"] == "192.0.2.10"
    assert event["destination_ip"] == "2001:db8::20"
    assert event["severity"] == "info"
    assert event["event_timestamp"] == "2026-01-01T20:04:05Z"
    assert event["parser_name"] == "sentrix-canonical"
    assert event["schema_version"] == "1.0"


def test_missing_optional_fields_remain_unknown(client):
    response = client.post(
        "/api/v1/events",
        json={"source": "collector-a", "event_type": "custom.unknown"},
    )
    assert response.status_code == 201
    event = client.get(f"/api/v1/events/{response.json()['id']}").json()
    assert event["event_timestamp"] is None
    assert event["host"] is None
    assert event["user"] is None
    assert event["source_ip"] is None
    assert event["severity"] is None
    assert event["event_type"] == "custom.unknown"


def test_invalid_ip_timestamp_and_schema_version_are_rejected(client):
    invalid_ip = client.post("/api/v1/events", json=payload(source_ip="300.1.1.1"))
    invalid_timestamp = client.post(
        "/api/v1/events", json=payload(event_timestamp="not-a-timestamp")
    )
    unsupported_version = client.post("/api/v1/events", json=payload(schema_version="9.9"))
    assert invalid_ip.status_code == 422
    assert invalid_timestamp.status_code == 422
    assert unsupported_version.status_code == 422
    assert "input" not in str(invalid_ip.json())


def test_timezone_naive_timestamps_are_rejected(client):
    response = client.post("/api/v1/events", json=payload(event_timestamp="2026-01-02T03:04:05"))
    assert response.status_code == 422


def test_listing_filters_and_paginates_with_stable_order(client):
    ids = []
    for kind, severity in (
        ("authentication.failure", "high"),
        ("process.start", "low"),
        ("authentication.failure", "high"),
    ):
        response = client.post(
            "/api/v1/events",
            json=payload(
                event_type=kind, severity=severity, event_timestamp="2026-01-01T00:00:00Z"
            ),
        )
        assert response.status_code == 201
        ids.append(response.json()["id"])

    first = client.get(
        "/api/v1/events?event_type=authentication.failure&severity=HIGH&limit=1&offset=0"
    )
    second = client.get(
        "/api/v1/events?event_type=authentication.failure&severity=high&limit=1&offset=1"
    )
    assert first.status_code == second.status_code == 200
    assert first.json()["total"] == 2
    assert len(first.json()["items"]) == len(second.json()["items"]) == 1
    assert first.json()["items"][0]["id"] != second.json()["items"][0]["id"]


def test_list_rejects_unbounded_pagination_and_bad_time_range(client):
    assert client.get("/api/v1/events?limit=1000").status_code == 422
    assert client.get("/api/v1/events?offset=10001").status_code == 422
    response = client.get(
        "/api/v1/events?start_time=2026-02-01T00:00:00Z&end_time=2026-01-01T00:00:00Z"
    )
    assert response.status_code == 422


def test_missing_event_is_404(client):
    import uuid

    assert client.get(f"/api/v1/events/{uuid.uuid4()}").status_code == 404


def test_request_body_size_is_bounded(client):
    response = client.post("/api/v1/events", json=payload(raw_vendor_field="x" * 3_000))
    assert response.status_code == 413
    assert "Request body" in response.json()["detail"]


def test_non_json_finite_values_are_rejected(client):
    response = client.post(
        "/api/v1/events",
        content='{"source":"demo","event_type":"custom","vendor_value":NaN}',
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 422
    assert response.json()["detail"] == "Event payload must contain valid JSON values"


def test_database_failure_does_not_report_success_or_leak_connection_details(client):
    with client.application.state.engine.begin() as connection:
        connection.exec_driver_sql("DROP TABLE security_events")
    response = client.post("/api/v1/events", json={"source": "test", "event_type": "custom.event"})
    assert response.status_code == 503
    assert response.json() == {"detail": "Event could not be persisted"}


def test_event_survives_application_recreation(tmp_path):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from sentrix.core.config import Settings
    from sentrix.db.base import Base
    from sentrix.main import create_app
    from tests.conftest import ASGISyncClient

    database_url = f"sqlite:///{tmp_path / 'restart.db'}"
    first_engine = create_engine(database_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(first_engine)
    first_app = create_app(
        Settings(database_url=database_url, app_env="test"),
        first_engine,
        sessionmaker(bind=first_engine, expire_on_commit=False),
    )
    created = ASGISyncClient(first_app).post(
        "/api/v1/events", json={"source": "restart-test", "event_type": "custom.event"}
    )
    assert created.status_code == 201
    event_id = created.json()["id"]
    first_engine.dispose()

    second_engine = create_engine(database_url, connect_args={"check_same_thread": False})
    second_app = create_app(
        Settings(database_url=database_url, app_env="test"),
        second_engine,
        sessionmaker(bind=second_engine, expire_on_commit=False),
    )
    retrieved = ASGISyncClient(second_app).get(f"/api/v1/events/{event_id}")
    assert retrieved.status_code == 200
    assert retrieved.json()["id"] == event_id
    assert retrieved.json()["event_type"] == "custom.event"
    second_engine.dispose()


def test_fingerprint_is_deterministic_and_key_order_independent():
    first = {"source": "test", "raw": {"a": 1, "b": 2}}
    second = {"raw": {"b": 2, "a": 1}, "source": "test"}
    assert fingerprint_for(first) == fingerprint_for(second)


def test_raw_timestamp_representation_is_preserved(client):
    submitted = payload(event_timestamp="2026-01-02T03:04:05+07:00")
    saved = client.post("/api/v1/events", json=submitted).json()
    event = client.get(f"/api/v1/events/{saved['id']}").json()
    assert event["raw_event"]["event_timestamp"] == "2026-01-02T03:04:05+07:00"
    assert datetime.fromisoformat(event["event_timestamp"].replace("Z", "+00:00")).tzinfo == UTC
