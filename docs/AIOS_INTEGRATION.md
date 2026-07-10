# Jeffrey Reminder Engine — AIOS Integration

## Module Boundary

Jeffrey Reminder Engine remains an independent static module in `hudsonmar-852/Jeffrey`.

It consumes approved AIOS outputs but owns its own production website, data contract, validation and deployment.

```text
AIOS Core
├── Daily Intelligence
├── Knowledge Base
├── Prompt Library
├── Automation Engine
├── GitHub Share
└── Jeffrey Reminder Engine
    ├── data/today.json
    ├── scripts/validate_today.py
    ├── app.js
    └── GitHub Pages
```

## Daily Pipeline

1. Collect current Hong Kong context from reliable sources.
2. Select only topics relevant to daily life, fitness, recovery or community context.
3. Treat normal summer weather as background, not the default headline.
4. Generate messages using the Jeffrey tone and audience rules.
5. Run Zero Hallucination checks:
   - verify date and source timestamp;
   - distinguish facts from creative wording;
   - avoid medical diagnosis or guaranteed results;
   - reject unverified community events;
   - remove duplicated or recently repeated hooks.
6. Write the complete output to `data/today.json`.
7. Run `python scripts/validate_today.py`.
8. Commit only when validation passes.
9. GitHub Actions validates again before deployment.

## Required Data Fields

Top-level required fields:

- `date`
- `version`
- `theme`
- `lifePulse`

Supported content collections:

- `dailySpecial`
- `jeffreyToday`
- `weatherMessages`
- `groups`
- `archive`

Each message requires:

- `topic`
- `content`

A unique `id` is strongly required for rotation, favourite and copy tracking.

## Rotation Rules

- Do not repeat the same topic angle within seven days.
- Do not use weather as the main hook on consecutive days unless it is genuinely high-impact.
- Rotate between office life, recovery, fitness lifestyle, social connection, seasonal context and special messages.
- Keep one message focused on one idea and one action.
- Archive older messages instead of deleting useful material.

## Failure Handling

The website uses a static-first design:

1. Load `data/today.json` with no-cache and timeout.
2. Retry a compatible relative path.
3. Fall back to the browser's last-good dataset.
4. Show a visible error and retry control if no dataset is available.

This separates the production webpage from temporary AIOS or data-source failures.

## Deployment

Workflow: `.github/workflows/pages.yml`

Deployment is allowed only after:

- JSON validation passes;
- required website files exist;
- the AIOS module contract exists.

Production URL:

`https://hudsonmar-852.github.io/Jeffrey/`
