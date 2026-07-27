# Jeffrey Relationship Messaging Engine v4.0.0 deployment record

Status: Production
Risk: Medium
Human review: Approved before merge
Production URL: https://hudsonmar-852.github.io/Jeffrey/

## Deployment

- Pull request: https://github.com/hudsonmar-852/Jeffrey/pull/4
- Production commit: `1851fe32194dd088ae9ac43901dbf3b7735a9a3a`
- Workflow run: https://github.com/hudsonmar-852/Jeffrey/actions/runs/30250608503
- Pages deploy completed: `2026-07-27T08:37:57Z`
- Previous production version: `3.5.0`
- Deployed version: `4.0.0`

## Verification

- GitHub Actions validate: Passed
- GitHub Pages deploy: Passed
- Node tests: 20/20 passed
- Python tests: 4/4 passed
- Production dataset: 93 messages validated
- Live sourced messages: 4 validated
- Live mobile browser: Passed at 390 × 844
- Direct HKO browser fetch: Passed with `Weather verified`
- Generate, type filter, edit, Favourite, copy count, regenerate and member
  selector: Passed
- Existing Favourite, Usage, Approved and Done localStorage records: Preserved
- Unexpected JavaScript exceptions or failed assets: None

## Data and secrets

- No production data file was deleted or reset.
- No localStorage key was deleted, renamed or reset.
- No secret or paid service was added.
- HKO access uses its public official endpoint.
- CHP, major transport and holiday adapters remain backlog fallbacks.

## Rollback

1. Revert production commit
   `1851fe32194dd088ae9ac43901dbf3b7735a9a3a`, or redeploy baseline
   `1059944d6c5f2b94944d5ea93c0d391210cf7ff2`.
2. Run `.github/workflows/pages.yml` and require validation to pass.
3. Do not clear browser localStorage. v3.5 ignores additive v4 keys and continues
   to use `jeffreyFavourites`, `jeffreyUsage`, `jeffreyApproved` and
   `jeffreyDone`.

Safety branch:
`backup/jeffrey-v3.5-before-relationship-engine-20260726`
