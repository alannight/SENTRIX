import runpy
import sys
from pathlib import Path

import pytest


def test_retention_cli_rejects_age_above_configured_maximum(monkeypatch):
    script = Path(__file__).resolve().parents[3] / "scripts" / "purge_expired_events.py"
    retention = runpy.run_path(str(script))
    monkeypatch.setattr(sys, "argv", [str(script), "--older-than-days", "36501", "--apply"])

    with pytest.raises(SystemExit, match="2"):
        retention["main"]()
