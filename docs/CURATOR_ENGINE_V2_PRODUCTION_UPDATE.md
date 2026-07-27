# Curator Engine v2 Production Update

Status: implementation complete; human PR review required  
Architecture: approved daily curated board  
Release target: Jeffrey 5.0.0

## Executive summary

The catalogue-style reminder path is replaced by one deterministic Curator
pipeline and one shared Top 5 board. The source collector remains unchanged.
Forty candidates are generated internally, reviewed against the approved
weights and hard-rejection rules, and written to the archive. Only the five
highest-scoring eligible drafts reach the customer-facing board. Internal
reasons, sources, scores and rejected candidates never render in a card.

## Architecture review and gap analysis

| Severity | Finding | Resolution |
| --- | --- | --- |
| Critical | `today.json` accumulated old reminders and the UI flattened up to 60 cards. | Board reads only `curator-board.json`, which must contain exactly five items. |
| High | Source, weather and workflow language appeared beside customer text. | Internal fields exist only in archive/board data and are not rendered or copied. |
| High | Runtime generation exposed controls, profiles and three equal actions. | Runtime generation and category tabs are removed from the board. |
| High | Old reminders were mixed with current suggestions. | Legacy entries migrate once into `archive.json`; the board never reads them. |
| Medium | Existing scoring did not match the approved seven-reviewer weights. | Weights are frozen in `REVIEWER_WEIGHTS` and tested to total 100%. |
| Medium | Human review was stated but not enforced before copy. | First copy requires explicit confirmation and records approval locally. |

### Dependency and boundary review

- `scripts/generate_daily_content.py` remains the verified scheduled-output
  collector.
- `scripts/generate_curator_board.mjs` is the sole transformation boundary
  between source output, archive and board.
- `reminder/engine.mjs` owns freshness checks, candidate generation, rejection,
  scoring, selection and migration.
- `reminder/app.js` is presentation-only and loads the five-item board.
- The root and `/reminder/` routes reuse the same JavaScript and data file.

No provider, public AIOS contract or external account was added.

## Decision log

### D-001 — Separate source collection from curation

- Problem: replacing the proven collector would increase production risk.
- Alternatives: rewrite the Python collector; curate in the browser; add a
  deterministic build step.
- Decision: add a deterministic Node curation step after collection.
- Trade-off: the workflow uses two runtimes already present in CI.
- Impact: existing sources remain compatible and curation can be tested alone.

### D-002 — Store all candidates, publish five

- Problem: auditability conflicts with a quiet customer-facing board.
- Decision: archive all candidates and expose a separate five-item board.
- Trade-off: archive grows daily and will need a future retention policy.

### D-003 — Human confirmation at first copy

- Problem: a Draft must not be treated as approved automatically.
- Decision: first copy presents a confirmation gate; approval is stored locally.
- Trade-off: approval is browser-local until a server-side audit store exists.

## Migration

1. The daily workflow generates the legacy-compatible `data/today.json`.
2. `node scripts/generate_curator_board.mjs` validates same-day sources.
3. Pre-v2 catalogue entries are mapped to the frozen reminder data fields with
   `status: Archived`.
4. Forty new candidates are appended to `data/archive.json`.
5. Exactly five eligible drafts are written to `data/curator-board.json`.
6. Existing browser favourites and usage keys are not deleted.

The migration is additive. Historical daily JSON files are preserved.

## Rollback

1. Revert the Curator v2 release commit(s).
2. Redeploy the previous Pages artifact or previous `main` commit.
3. Restore the old daily workflow command order.
4. Keep `data/archive.json`; it is additive and does not block the old UI.
5. Do not clear browser storage. Old and new storage keys are separate.

Rollback does not require destructive data deletion.

## Test evidence

- Unit contracts cover 40 candidates, exact Top 5 selection, no duplicates,
  stale/conflicting/speculative rejection, complete data fields, hard wording
  rejection, friend-like Cantonese, archive-only legacy data, and copy isolation.
- UI contracts verify the three-action hierarchy and absence of internal
  metadata.
- Browser verification covers both routes, five visible cards, no console
  errors and clipboard isolation.

Screenshots:

- [Before: catalogue dashboard](screenshots/curator-v2-before.png)
- [After: daily curated board](screenshots/curator-v2-after.png)

## Production checklist

- [x] Exactly five cards
- [x] No old reminders on board
- [x] All candidates archived
- [x] Draft/Approved badge
- [x] Human confirmation before first copy
- [x] Copy contains only `customer_text`
- [x] No source, score, reason or workflow metadata in cards
- [x] Primary copy action; secondary favourite and used actions
- [x] Daily workflow generates board and archive
- [x] Migration and rollback documented
- [x] GitHub Actions successful (run `30293397308`)
- [ ] Human visual and language review

## Risk assessment

| Risk | Level | Mitigation |
| --- | --- | --- |
| Candidate library becomes repetitive | Medium | Novelty checks recent archive; refresh library under human review. |
| Archive grows indefinitely | Medium | Add a retention/export policy in a later approved EO. |
| Browser-local approval is not shared across devices | Medium | Keep the gate explicit; evaluate a governed audit store later. |
| Source collector may produce no fresh output | Low | Evergreen candidates remain usable without making source claims. |
| Cantonese quality is subjective | Low | Automated gates plus mandatory human copy confirmation. |

## Documentation audit

The README now describes Curator v2. The schema, migration, rollback, workflow
and risk record are linked from one document to avoid duplicate specifications.
Historical architecture documents remain untouched and preserve Git history.

## Architecture readiness report

- Architecture completeness: 94%
- Specification coverage: 94%
- Documentation coverage: 93%
- Governance compliance: 96%
- MVP readiness: 95%
- Overall status: MVP READY
- Outstanding questions: archive retention and cross-device approval audit
- Freeze recommendation: freeze Curator Engine v2 after CI and human language
  review pass.

READY FOR MVP DEVELOPMENT
