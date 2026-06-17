# Jeffrey Repo Changelog

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
