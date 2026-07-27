#!/usr/bin/env python3
"""Generate Jeffrey's production catalogue from official Hong Kong public data."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ROOT / "config/content-sources.json"
DEFAULT_OUTPUT = ROOT / "data/today.json"
HK = ZoneInfo("Asia/Hong_Kong")
USER_AGENT = "Jeffrey-AIOS/3.5 (+https://hudsonmar-852.github.io/Jeffrey/)"


def load_legacy_base(path: Path) -> dict[str, Any]:
    """Read the first JSON object from legacy files that may contain concatenated data."""
    if not path.exists() or not path.stat().st_size:
        return {}
    text = path.read_text(encoding="utf-8")
    value, _ = json.JSONDecoder().raw_decode(text.lstrip())
    if not isinstance(value, dict):
        raise ValueError("base dataset must start with a JSON object")
    return value


def fetch_json(url: str, timeout: int) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_rss(url: str, timeout: int) -> list[dict[str, str]]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/rss+xml, application/xml"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        root = ET.fromstring(response.read())
    items: list[dict[str, str]] = []
    for item in root.findall(".//item")[:10]:
        value = lambda tag: (item.findtext(tag) or "").strip()
        if value("title"):
            items.append({"title": value("title"), "link": value("link"), "published": value("pubDate")})
    return items


def first_station(entries: Any, preferred: str | None = None) -> dict[str, Any]:
    values = entries.get("data", []) if isinstance(entries, dict) else []
    if preferred:
        for entry in values:
            if entry.get("place") == preferred:
                return entry
    return values[0] if values else {}


def source_fields(source: dict[str, Any], timestamp: str) -> dict[str, str]:
    return {"source": source["name"], "sourceUrl": source["url"], "sourceTimestamp": timestamp}


def make_id(prefix: str, day: str, seed: str) -> str:
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:8]
    return f"{prefix}-{day.replace('-', '')}-{digest}"

def draft(day: str, prefix: str, topic: str, content: str, priority: int, provenance: dict[str, str]) -> dict[str, Any]:
    return {
        "id": make_id(prefix, day, content),
        "section": "S1",
        "topic": topic,
        "content": content,
        "hook": content,
        "cta": "",
        "priority": priority,
        "approvalStatus": "pending",
        "status": "draft_human_approval_required",
        "humanScore": 98,
        **provenance,
    }


def preserve_history(base: dict[str, Any]) -> list[dict[str, Any]]:
    """Move displaced daily items into history without deleting or rewriting them."""
    values = [
        *(base.get("dailySpecial", []) or []),
        *(base.get("jeffreyToday", []) or []),
        *(base.get("archive", []) or []),
    ]
    seen: set[str] = set()
    result: list[dict[str, Any]] = []
    for item in values:
        key = item.get("id") or item.get("content")
        if key and key not in seen:
            seen.add(key)
            result.append(item)
    return result


def collect(config: dict[str, Any], now: datetime) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    timeout = int(config.get("timeoutSeconds", 20))
    raw: dict[str, Any] = {}
    health: list[dict[str, Any]] = []
    for source in config["sources"]:
        started = datetime.now(HK)
        try:
            payload = fetch_rss(source["url"], timeout) if source["type"] == "rss" else fetch_json(source["url"], timeout)
            raw[source["id"]] = payload
            health.append({"id": source["id"], "name": source["name"], "status": "ok", "required": source["required"], "fetchedAt": started.isoformat(timespec="seconds")})
        except Exception as exc:
            health.append({"id": source["id"], "name": source["name"], "status": "error", "required": source["required"], "fetchedAt": started.isoformat(timespec="seconds"), "error": str(exc)[:240]})
    return raw, health


def transform(raw: dict[str, Any], health: list[dict[str, Any]], config: dict[str, Any], now: datetime, base: dict[str, Any]) -> dict[str, Any]:
    day = now.strftime("%Y-%m-%d")
    generated_at = now.isoformat(timespec="seconds")
    sources = {source["id"]: source for source in config["sources"]}
    weather = raw.get("hko_current_weather", {})
    forecast = raw.get("hko_forecast", {})
    temp = first_station(weather.get("temperature", {}), "香港天文台")
    humidity = first_station(weather.get("humidity", {}), "香港天文台")
    update_time = weather.get("updateTime") or generated_at
    general = (forecast.get("generalSituation") or "").strip()
    today_forecast = (forecast.get("weatherForecast") or [{}])[0]
    forecast_text = (today_forecast.get("forecastWeather") or "").strip()
    min_temp = (today_forecast.get("forecastMintemp") or {}).get("value")
    max_temp = (today_forecast.get("forecastMaxtemp") or {}).get("value")
    warnings = [str(x).strip() for x in weather.get("warningMessage", []) if str(x).strip()]
    temp_value = temp.get("value")
    humidity_value = humidity.get("value")

    if not weather and not forecast:
        raise RuntimeError("No verified HKO data; refusing to publish invented production content")

    range_text = f"{min_temp}–{max_temp}°C" if min_temp is not None and max_temp is not None else (f"{temp_value}°C" if temp_value is not None else "以天文台最新資料為準")
    warning_text = "；".join(warnings[:2]) if warnings else "暫未從即時資料讀到特別警告"
    weather_summary = "；".join(part for part in [f"氣溫 {range_text}", forecast_text, warning_text] if part)
    provenance = source_fields(sources["hko_current_weather"], update_time)
    if not weather:
        provenance = source_fields(sources["hko_forecast"], forecast.get("updateTime") or generated_at)

    messages: list[dict[str, Any]] = []
    if warnings:
        warning = warnings[0].rstrip("。. ")
        messages.append(draft(day, "warning", "今日安全提醒", f"出面有{warning}，今日唔好趕，安全到就得。", 1, provenance))
    if max_temp is not None and float(max_temp) >= 32:
        messages.append(draft(day, "heat", "今日天氣", f"今日最高大約 {max_temp}°C，出門前飲兩啖水先啦。", 2, provenance))
    if any(word in forecast_text for word in ("雨", "驟雨", "雷暴")):
        messages.append(draft(day, "rain", "今日天氣", "今日有雨，出門記得帶把遮呀☔", 3, provenance))
    if not messages:
        messages.append(draft(day, "weather", "今日天氣", f"今日大約 {range_text}，出門前望一眼天氣先啦。", 1, provenance))

    jeffrey_today = [
        {"id": make_id("jt", day, text), "topic": "Jeffrey 今日問候", "content": text,
         "approvalStatus": "pending", "status": "draft_human_approval_required", "humanScore": 98}
        for text in [
            "今日返工忙唔忙呀？如果今晚有堂，嚟到我哋慢慢入返節奏。",
            "最近訓練個節奏點呀？得閒覆我一句，我幫你睇下。",
            "今晚操嗰陣記住出力先呼氣，我幫你睇住。",
            "今日有嚟已經算數，唔使下下都做到盡。",
            "如果坐咗成日，嚟到先郁下膊頭，我哋慢慢開始。",
        ]
    ]
    groups = base.get("groups", {}) if isinstance(base.get("groups"), dict) else {}
    successful = sum(1 for item in health if item["status"] == "ok")
    required_failed = [item["id"] for item in health if item["required"] and item["status"] != "ok"]
    return {
        **base,
        "date": day,
        "version": "3.5.0",
        "theme": "AIOS 真實資料｜每日生活脈搏與訓練節奏",
        "lifePulse": general or weather_summary,
        "weatherContext": {"source": provenance["source"], "sourceUrl": provenance["sourceUrl"], "updateTime": provenance["sourceTimestamp"], "summary": weather_summary, "role": "verified_background"},
        "production": {"mode": "live", "generatedAt": generated_at, "timezone": "Asia/Hong_Kong", "successfulSources": successful, "totalSources": len(health), "requiredSourcesFailed": required_failed, "health": health, "autoDistribution": {"whatsapp": "disabled", "instagram": "disabled"}},
        "dailySpecial": messages[:5],
        "jeffreyToday": jeffrey_today,
        "weatherMessages": [],
        "archive": preserve_history(base),
        "groups": groups,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--base", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--fixture-dir", type=Path)
    args = parser.parse_args()
    config = json.loads(args.config.read_text(encoding="utf-8"))
    base = load_legacy_base(args.base)
    now = datetime.now(HK)
    if args.fixture_dir:
        raw = {}
        health = []
        for source in config["sources"]:
            path = args.fixture_dir / f"{source['id']}.json"
            if path.exists():
                raw[source["id"]] = json.loads(path.read_text(encoding="utf-8"))
                health.append({"id": source["id"], "name": source["name"], "status": "ok", "required": source["required"], "fetchedAt": now.isoformat(timespec="seconds")})
            else:
                health.append({"id": source["id"], "name": source["name"], "status": "error", "required": source["required"], "fetchedAt": now.isoformat(timespec="seconds"), "error": "fixture missing"})
    else:
        raw, health = collect(config, now)
    output = transform(raw, health, config, now, base)
    required_failed = output["production"]["requiredSourcesFailed"]
    if len(required_failed) == 2:
        print(f"ERROR: all required sources failed: {required_failed}", file=sys.stderr)
        return 1
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, args.output)
    print(f"OK: wrote {args.output} from {output['production']['successfulSources']} live sources")
    return 0


if __name__ == "__main__":
    sys.exit(main())
