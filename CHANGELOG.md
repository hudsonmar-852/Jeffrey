# Jeffrey Repo Changelog

## v5.0 — 2026-07-28

### Simplified
- One fused topic from compatible validated AIOS scheduled records.
- Exactly five daily cards.
- Copy and Favourite are the only customer-card actions.
- Removed member, tone, type, group-sorting, regenerate and mark-used controls.
- Historical reminders and browser tracking remain preserved.

## v4.1 — 2026-07-27

### Added
- Feature-flagged loader for `/aios/modules/jeffrey/latest.json`, the latest Daily Context record and draft catalogue.
- Scheduled drafts are shown before existing local drafts without deleting or overwriting browser history.
- Stored-record freshness and provenance display with legacy fallback.
- Today's panel selects five diverse drafts instead of displaying the full candidate catalogue.
- Legacy daily generation now emits three-to-five concise sourced items and archives displaced content intact.

### Safety
- The new adapter does not call a raw weather provider.
- `AIOS_DAILY_CONTEXT_V1` defaults off if runtime config cannot load.
- Every scheduled item remains `draft_human_approval_required`.
- Unverified first-person gym observations and generic government-news filler are excluded from the current sendable set.

## v4.0 — 2026-07-27

### Added
- Jeffrey Relationship Messaging Engine with three-to-five daily best drafts.
- Jeffrey Voice Lock and Professional Relationship Guard.
- Member, tone, message-type and training-day controls.
- Verified HKO browser context with a 30-minute cache and evergreen fallback.
- Edit, regenerate, Favourite, copy-count and last-copied support.
- Fifty-message voice scenarios and data/migration regression tests.
- Additive Relationship Engine panel on the production root `/Jeffrey/`.
- Root-route mobile browser coverage with legacy storage preservation checks.

### Preserved
- Existing v3.5 dashboard layout, daily messages, archives and category tabs.
- Existing production source health, Approve, Done and audit export workflow.
- Production `jeffreyFavourites` and `jeffreyUsage` localStorage maps.
- Human approval and disabled automatic WhatsApp/Instagram distribution.

### Safety
- No localStorage key is reset or deleted.
- Live claims require a fresh verified HKO source.
- Messages implying private intimacy, exclusivity or inferred personal state
  are rejected.
- Rollback restores production baseline `1059944` without clearing browser storage.

## v3.5 — 2026-07-21

### Added
- Official HKO and government-news collection and transformation layer.
- Daily GitHub Actions production refresh with last-known-good failure handling.
- Source health, provenance, approval, done and audit export dashboard workflow.
- Production schema, configuration, tests, templates and runbooks.

### Safety
- WhatsApp and Instagram automatic distribution remain disabled pending an approved RFC and credentials.
- No 1Password dependency. Grok testing is outside this pipeline.

## v3.0 — 2026-06-17

### Changed
- Standardized repo page structure using the same safe loader pattern as `bible.html`.
- Added page-level version metadata.
- Added locked GitHub blob loading to reduce risk when future updates are made.
- Added visible fallback error handling for loading failures.
- Updated `index.html` to show v3.0 standard structure.
- Updated `gym.html` to show v3.0 standard structure.

### Added
- `VERSION.json` for repo-level version control.
- `CHANGELOG.md` for update history.

### Version Control Rule
- Big structural / UX / repo-wide change: increase major version by `+1`.
- Small wording / content / UI change: increase minor version by `+0.1`.

### Pending
- `gym_m.html` mobile page standardization needs retry because the GitHub connector blocked the write attempt.
- `bible.html` already follows the loader pattern and remains the reference page.
