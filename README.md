# Jeffrey AIOS Production

Production URL: https://hudsonmar-852.github.io/Jeffrey/

Jeffrey is a static-first AIOS module that turns verified Hong Kong public data
into reviewable Cantonese client-content suggestions. The v4.0 Relationship
Messaging Engine adds short, professional relationship-first drafts while
preserving the complete v3.5 reminder dashboard, history, Favourite and copy
tracking. Every generated message remains a human-review draft.

## Local validation

```bash
python -m unittest discover -s tests -p "test_*.py" -v
node --test tests/relationship_engine.test.mjs
node --check reminder/engine.mjs
node --check reminder/app.js
python scripts/generate_daily_content.py
python scripts/validate_production.py
```

See `docs/AIOS_PRODUCTION_OPERATIONS.md` for daily operations and recovery.
See `docs/RELATIONSHIP_ENGINE_MIGRATION_ROLLBACK.md` for v4.0 migration and rollback.
