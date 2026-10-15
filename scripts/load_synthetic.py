"""Load the small synthetic fixture into a local SENTRIX development API."""

import hashlib
import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

API_BASE = os.environ.get("SENTRIX_API_URL", "http://127.0.0.1:8000/api/v1").rstrip("/")
DATASET = Path(__file__).resolve().parents[1] / "datasets" / "synthetic" / "events.jsonl"


def fingerprint(value: object) -> str:
    serialized = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def request_json(path: str, payload: dict | None = None) -> dict:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(
        f"{API_BASE}{path}",
        data=data,
        headers={"Content-Type": "application/json"} if data is not None else {},
        method="POST" if data is not None else "GET",
    )
    with urlopen(request, timeout=5) as response:
        return json.load(response)


def main() -> int:
    parsed = urlparse(API_BASE)
    if parsed.scheme != "http" or parsed.hostname not in {"localhost", "127.0.0.1", "::1"}:
        raise SystemExit("Synthetic loading is restricted to a local HTTP API endpoint.")
    try:
        request_json("/health")
        loaded = 0
        skipped = 0
        with DATASET.open(encoding="utf-8") as records:
            for line_number, line in enumerate(records, start=1):
                event = json.loads(line)
                if event.get("raw_event", {}).get("synthetic") is not True:
                    raise ValueError(f"Record {line_number} is not labeled synthetic")
                event_fingerprint = fingerprint(event)
                query = urlencode({"event_fingerprint": event_fingerprint, "limit": "1"})
                matches = request_json(f"/events?{query}")
                if matches["total"]:
                    skipped += 1
                    continue
                request_json("/events", event)
                loaded += 1
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError, KeyError, ValueError) as exc:
        raise SystemExit(f"Synthetic load failed: {exc}") from None
    print(f"Synthetic records submitted: {loaded}; already present: {skipped}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

