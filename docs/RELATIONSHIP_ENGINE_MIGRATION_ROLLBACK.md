# Jeffrey Relationship Messaging Engine v4.0

Status: Approved Production Amendment — human review required before merge
Risk: Medium
Date: 2026-07-26

## Migration

The change is additive to the existing v3.5 Reminder dashboard.

- Existing `data/today.json`, daily JSON and archive files remain unchanged.
- Existing category tabs and message cards remain available below the new
  best-message panel.
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

- Jeffrey Voice and professional-boundary review.
- Mobile browser smoke test.
- Confirm direct HKO browser access on the deployed origin.
- Review the draft PR and GitHub Actions checks.
