# Daily Content Pipeline

1. At 07:15 HKT, GitHub Actions calls official sources defined in `config/content-sources.json`.
2. `generate_daily_content.py` normalizes raw responses, creates Cantonese operator suggestions, and records provenance.
3. If both required HKO endpoints fail, the job stops and preserves the last known good file.
4. `validate_today.py` validates the established AIOS contract; `validate_production.py` checks live provenance.
5. Changed data is committed to `main`; the existing Pages workflow validates and deploys it.
6. Jeffrey reviews each pending card in the dashboard, approves it, copies it, and marks it done.
7. The audit log can be exported locally. WhatsApp and Instagram remain manual and disabled by default.
