# Jeffrey AIOS Production

Production URL: https://hudsonmar-852.github.io/Jeffrey/

Production target: Jeffrey Curator Engine v2 / application 5.0.0

Jeffrey is a static-first AIOS module that turns verified scheduled outputs into
a daily curated board. Curator Engine v2 generates 40 internal candidates,
applies the approved seven-reviewer weighted panel and hard rejection rules,
archives every candidate, and exposes exactly five short Cantonese drafts.
Both `/Jeffrey/` and `/Jeffrey/reminder/` use the same board. Copy is immediate
and includes only `customer_text`; no per-message approval state is stored.

Previous v4 deployment record:
`docs/RELATIONSHIP_ENGINE_DEPLOYMENT_RECORD.md`.

## Local validation

```bash
python -m unittest discover -s tests -p "test_*.py" -v
node --test tests/*.test.mjs
node --check app.js
node --check relationship-app.mjs
node --check reminder/engine.mjs
node --check reminder/app.js
node --check scripts/generate_curator_board.mjs
python scripts/generate_daily_content.py
node scripts/generate_curator_board.mjs
python scripts/validate_production.py
```

See `docs/AIOS_PRODUCTION_OPERATIONS.md` for daily operations and recovery.
See `docs/CURATOR_ENGINE_V2_PRODUCTION_UPDATE.md` for architecture review,
migration, rollback, risks, and the production checklist.
