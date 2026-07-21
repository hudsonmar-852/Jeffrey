#!/usr/bin/env python3
import importlib.util
import json
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("generator", ROOT / "scripts/generate_daily_content.py")
generator = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(generator)


class GeneratorTests(unittest.TestCase):
    def setUp(self):
        self.config = json.loads((ROOT / "config/content-sources.json").read_text(encoding="utf-8"))
        fixtures = ROOT / "tests/fixtures"
        self.raw = {
            "hko_current_weather": json.loads((fixtures / "hko_current_weather.json").read_text(encoding="utf-8")),
            "hko_forecast": json.loads((fixtures / "hko_forecast.json").read_text(encoding="utf-8")),
            "gov_news": json.loads((fixtures / "gov_news.json").read_text(encoding="utf-8")),
        }
        self.health = [{"id": s["id"], "name": s["name"], "status": "ok", "required": s["required"], "fetchedAt": "2026-07-21T08:40:00+08:00"} for s in self.config["sources"]]
        self.now = datetime(2026, 7, 21, 8, 40, tzinfo=ZoneInfo("Asia/Hong_Kong"))

    def test_transform_produces_sourced_cantonese_content(self):
        data = generator.transform(self.raw, self.health, self.config, self.now, {"groups": {}})
        self.assertEqual(data["version"], "3.5.0")
        self.assertEqual(data["production"]["mode"], "live")
        self.assertGreaterEqual(len(data["dailySpecial"]), 4)
        self.assertTrue(all(item.get("sourceUrl") for item in data["dailySpecial"]))
        self.assertIn("唔使硬頂", " ".join(item["content"] for item in data["dailySpecial"]))

    def test_refuses_to_publish_without_hko(self):
        with self.assertRaises(RuntimeError):
            generator.transform({"gov_news": []}, self.health, self.config, self.now, {})

    def test_ids_are_deterministic(self):
        first = generator.transform(self.raw, self.health, self.config, self.now, {})
        second = generator.transform(self.raw, self.health, self.config, self.now, {})
        self.assertEqual([x["id"] for x in first["dailySpecial"]], [x["id"] for x in second["dailySpecial"]])

    def test_legacy_concatenated_json_uses_first_object(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "legacy.json"
            path.write_text('{"date":"first"}{"date":"second"}', encoding="utf-8")
            self.assertEqual(generator.load_legacy_base(path)["date"], "first")


if __name__ == "__main__":
    unittest.main()
