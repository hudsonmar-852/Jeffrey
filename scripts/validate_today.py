#!/usr/bin/env python3
import json
import sys
from datetime import datetime
from pathlib import Path

DATA_PATH = Path('data/today.json')


def fail(message: str) -> None:
    print(f'ERROR: {message}')
    sys.exit(1)


def main() -> None:
    if not DATA_PATH.exists():
        fail('data/today.json is missing')

    try:
        data = json.loads(DATA_PATH.read_text(encoding='utf-8'))
    except Exception as exc:
        fail(f'Invalid JSON: {exc}')

    if not isinstance(data, dict):
        fail('Root must be an object')

    for field in ('date', 'version', 'theme', 'lifePulse'):
        if not isinstance(data.get(field), str) or not data[field].strip():
            fail(f'Missing or invalid required field: {field}')

    try:
        datetime.strptime(data['date'], '%Y-%m-%d')
    except ValueError:
        fail('date must use YYYY-MM-DD')

    collections = []
    for key in ('dailySpecial', 'jeffreyToday', 'weatherMessages', 'archive'):
        value = data.get(key, [])
        if value is not None and not isinstance(value, list):
            fail(f'{key} must be an array')
        collections.extend(value or [])

    groups = data.get('groups', {})
    if groups is not None and not isinstance(groups, dict):
        fail('groups must be an object')
    for name, items in (groups or {}).items():
        if not isinstance(items, list):
            fail(f'groups.{name} must be an array')
        collections.extend(items)

    if not collections:
        fail('At least one reminder message is required')

    seen_ids = set()
    duplicate_ids = []
    for index, item in enumerate(collections):
        if not isinstance(item, dict):
            fail(f'Message #{index + 1} must be an object')
        for field in ('topic', 'content'):
            if not isinstance(item.get(field), str) or not item[field].strip():
                fail(f'Message #{index + 1} missing {field}')
        message_id = item.get('id')
        if message_id:
            if message_id in seen_ids:
                duplicate_ids.append(message_id)
            seen_ids.add(message_id)
        if len(item['content']) > 1000:
            fail(f'Message {message_id or index + 1} exceeds 1000 characters')

    if duplicate_ids:
        fail(f'Duplicate message ids: {sorted(set(duplicate_ids))}')

    weather = data.get('weatherContext', {})
    if weather and not isinstance(weather, dict):
        fail('weatherContext must be an object')
    if weather:
        for field in ('source', 'updateTime', 'summary', 'role'):
            if field not in weather:
                fail(f'weatherContext missing {field}')

    print(f'OK: {len(collections)} messages validated for {data["date"]}')


if __name__ == '__main__':
    main()
