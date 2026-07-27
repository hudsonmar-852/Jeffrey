# Jeffrey Relationship Messaging Engine v4.0

Status: Approved Production Amendment — deployed after human review
Risk: Medium
Date: 2026-07-26

## Migration

The change is additive to the existing v3.5 production root dashboard. The
Relationship Engine is loaded by a separate `relationship-app.mjs` module, so
the stable `app.js` operator workflow continues to own legacy content.

- Existing `data/today.json`, daily JSON and archive files remain unchanged.
- Existing category tabs and message cards remain available below the new
  best-message panel.
- Existing Production Sources, Approve, Done and audit export controls remain
  on the root `/Jeffrey/` route.
- Existing `jeffreyFavourites` and `jeffreyUsage` localStorage maps remain the
  canonical Favourite and copy-tracking stores.
- Generated drafts use the new `jeffreyRelationshipMessages` key.
- Member profiles use the new `jeffreyRelationshipMembers` key.
- No localStorage key is deleted, renamed or reset.
- Newly generated drafts use `unshift()` and retain previous generated drafts.
- Every generated message remains `approvalStatus: pending`.

## Rollback

1. Revert the v4.0 feature commit or restore production commit `1059944`.
2. Deploy the restored commit through `.github/workflows/pages.yml`.
3. Do not clear localStorage. v3.5 ignores the new relationship-engine keys and
   continues to read `jeffreyFavourites` and `jeffreyUsage`.

Safety branch:
`backup/jeffrey-v3.5-before-relationship-engine-20260726`

## Human review gates

- [x] Jeffrey Voice and professional-boundary review.
- [x] Mobile browser smoke test.
- [x] Confirm direct HKO browser access on the deployed origin.
- [x] Review PR #4 and GitHub Actions checks.

Production commit: `1851fe32194dd088ae9ac43901dbf3b7735a9a3a`
