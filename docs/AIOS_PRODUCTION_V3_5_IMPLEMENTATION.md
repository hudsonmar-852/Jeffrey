# AIOS Production v3.5 Implementation Brief

## Objective

Connect the existing Jeffrey Reminder Engine to verified, current Hong Kong public data and expose an auditable approve/copy/done production workflow in the existing dashboard.

## Scope

- Preserve the approved static-first AIOS module architecture.
- Add a deterministic transformation layer for official Hong Kong weather and government news sources.
- Publish a schema-compatible `data/today.json` with source provenance and generation health.
- Extend the existing dashboard with production status, approval, copy, completion and JSON export controls.
- Run collection daily through GitHub Actions and retain manual dispatch.
- Keep WhatsApp and Instagram publishing disabled until credentials, consent and platform review are available.

## Dependencies

- Python 3.12 standard library.
- Hong Kong Observatory Open Data API.
- Hong Kong Government Information Services Department RSS.
- GitHub Actions and GitHub Pages.
- Existing `data/today.json`, `scripts/validate_today.py`, `app.js` and `.github/workflows/pages.yml` contracts.

## Dependency and Overlap Analysis

- `index.html` and `app.js` are the production dashboard; `reminder/` is a legacy overlapping view and will not receive a second implementation.
- Existing dated JSON catalogues remain archive/rotation inputs; the generator only replaces `data/today.json`.
- Existing `pages.yml` remains the deployment gate. A separate collection workflow writes data and relies on the existing Pages push trigger.
- Browser-only state cannot safely write `done_log.json` to GitHub. Approval and done state therefore remain local-first and can be exported as JSON for audit/import.

## Risks

- Public endpoints can time out or change schema. The generator uses timeouts, per-source health, and the last valid file rather than inventing facts.
- Automated commits could loop. The collection workflow only watches its own schedule/manual trigger and commits only changed data.
- Medical and social claims are high risk. No diagnosis, outbreak interpretation, or unsourced trend is generated.
- WhatsApp/Instagram automation needs external credentials and explicit approval. It remains non-blocking and disabled.

## Acceptance Criteria

- At least one official live source succeeds, otherwise generation exits non-zero and preserves the last known good production file.
- Every generated live topic includes source name, URL and source/update timestamp.
- Generated JSON passes the existing validator plus production provenance checks.
- Dashboard shows collection health and supports approve, copy, mark done, filtering and audit export.
- GitHub Actions can run daily and manually without third-party secrets.
- No 1Password dependency and no Grok test.

## Deliverables

- Production collector/transformer and validation tests.
- Daily GitHub Actions workflow.
- Updated dashboard and AIOS module contract.
- Configuration, schema example and operations documentation.

## Output Files

- `scripts/generate_daily_content.py`
- `scripts/validate_production.py`
- `tests/test_content_generator.py`
- `.github/workflows/daily-content.yml`
- `config/content-sources.json`
- `spec/daily-content.schema.json`
- `templates/done-log.example.json`
- `examples/daily-content.example.json`
- `workflows/daily-content-pipeline.md`
- `docs/AIOS_PRODUCTION_OPERATIONS.md`
- updates to `index.html`, `app.js`, `style.css`, `aios/module.json`, `VERSION.json`, `CHANGELOG.md`, and `.github/workflows/pages.yml`

## Branch Contract

- **Branch Goal:** deliver Jeffrey AIOS production data and operator workflow v3.5.
- **Input:** official public source responses and the last valid production catalogue.
- **Output:** validated `data/today.json` and an operator-ready dashboard.
- **Affected Files:** only files listed under Output Files and generated `data/today.json`.
- **Dependencies:** Python, GitHub Actions, GitHub Pages and official public endpoints.
- **Definition of Done:** tests pass, live collection succeeds, JSON validates, dashboard script parses, and a reviewable PR is open.
- **Review Checklist:** source provenance, Cantonese tone, no invented facts, no secret dependency, no auto-publishing, responsive UI, rollback via previous commit.
