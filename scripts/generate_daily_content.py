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
    hook = f"今日天文台預測大約 {range_text}。出門或者訓練前望一眼身體狀態，行程留少少彈性會舒服好多。"
    messages.append({"id": make_id("ds", day, hook), "section": "S1", "topic": "⭐ 今日精選｜天氣節奏", "content": hook, "hook": hook, "cta": "有需要就收藏低，出門前再望天文台最新資訊。", "priority": 1, "approvalStatus": "pending", "humanScore": 98, **provenance})

    if warnings:
        content = f"天文台現時提示：{warnings[0]}。今日戶外活動唔使硬頂，環境或者身體唔舒服就轉室內、縮短時間。"
    else:
        content = "今日未見特別警告都唔代表要追到盡。先熱身、再按精神同呼吸決定訓練份量，質素行先。"
    messages.append({"id": make_id("w", day, content), "section": "S1", "topic": "🌦 官方天氣｜安全節奏", "content": content, "hook": content, "cta": "發送前再核對天文台警告。", "priority": 2, "approvalStatus": "pending", "humanScore": 98, **provenance})

    if humidity_value is not None:
        content = f"天文台最新相對濕度約 {humidity_value}%。濕熱日子個人容易攰快啲，今日留返少少餘力，完成得穩比做得盡更實際。"
        messages.append({"id": make_id("w", day, content), "section": "S1", "topic": "💧 官方天氣｜濕度背景", "content": content, "hook": content, "cta": "按自己狀態補水同休息。", "priority": 3, "approvalStatus": "pending", "humanScore": 97, **provenance})

    news = raw.get("gov_news", [])
    if news:
        item = news[0]
        content = f"今日政府資訊有一項更新：{item['title']}。呢項只作今日生活脈搏，Jeffrey 發送前先打開原文，確認同客人有關先分享。"
        messages.append({"id": make_id("gov", day, content), "section": "S2", "topic": "🏙 香港脈搏｜政府資訊", "content": content, "hook": "待 Jeffrey 閱讀原文後手動輸入", "cta": "先核對原文，再決定是否分享。", "priority": 4, "approvalStatus": "pending", "humanScore": 94, **source_fields(sources["gov_news"], item.get("published") or generated_at), "articleUrl": item.get("link", "")})

    old_special = [m for m in base.get("dailySpecial", []) if m.get("sourceTimestamp") is None]
    daily_special = messages + old_special[:5]
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
        "dailySpecial": daily_special,
        "weatherMessages": [],
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
