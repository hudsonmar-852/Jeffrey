# Jeffrey AIOS Production

Production URL: https://hudsonmar-852.github.io/Jeffrey/

Jeffrey is a static-first AIOS module that turns verified Hong Kong public data into reviewable Cantonese client-content suggestions. The operator dashboard requires approval before copying live-source content and records approve/done state locally.

## Local validation

```bash
python -m unittest discover -s tests -p "test_*.py" -v
python scripts/generate_daily_content.py
python scripts/validate_production.py
```

See `docs/AIOS_PRODUCTION_OPERATIONS.md` for daily operations and recovery.
