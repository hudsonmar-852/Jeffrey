#!/usr/bin/env python3
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data/today.json"

result = subprocess.run([sys.executable, str(ROOT / "scripts/validate_today.py")], cwd=ROOT)
if result.returncode:
    raise SystemExit(result.returncode)

data = json.loads(DATA.read_text(encoding="utf-8"))
production = data.get("production")
if not isinstance(production, dict) or production.get("mode") != "live":
    raise SystemExit("ERROR: production.mode must be live")
if not production.get("generatedAt") or not isinstance(production.get("health"), list):
    raise SystemExit("ERROR: missing production generation metadata")
live = [m for m in data.get("dailySpecial", []) if m.get("sourceTimestamp")]
if not live:
    raise SystemExit("ERROR: no sourced live messages")
for message in live:
    for field in ("source", "sourceUrl", "sourceTimestamp", "approvalStatus", "priority"):
        if message.get(field) in (None, ""):
            raise SystemExit(f"ERROR: {message.get('id')} missing {field}")
print(f"OK: production provenance validated for {len(live)} live messages")
