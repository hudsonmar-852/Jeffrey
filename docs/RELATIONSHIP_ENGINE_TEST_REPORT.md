# Relationship Messaging Engine v4.0 test report

Date: 2026-07-27
Status: Local, CI and deployed production validation passed

Automated coverage:

- Five passing drafts for ten required voice scenarios.
- Hong Kong Cantonese Voice Lock and forbidden written-language phrases.
- Professional Relationship Guard and training-anchor requirement.
- Verified HKO, stale and fetch-failure behavior.
- Evergreen fallback without real-time claims.
- Production Favourite and Usage key preservation.
- Existing Python generator and production validators.
- Daily selection type diversity.
- General, individual-member and member-group selection.

Production-root browser coverage passed at 390 × 844:

- Root `/Jeffrey/` loads both the preserved v3.5 operator dashboard and five new cards.
- Production source health, Approve, Done and audit export remain present.
- Generate, type filter, edit, Favourite, copy count and regenerate.
- Member creation and automatic group option.
- Pre-existing Favourite, Usage, Approved and Done records remain byte-for-byte usable.
- No horizontal overflow, JavaScript exceptions or unexpected failed resources.
- The optional absent daily overlay remains a permitted 404 fallback in the v3.5 loader.

Production coverage completed:

- Jeffrey human voice approval received before merge.
- GitHub Actions validation and Pages deployment passed.
- Deployed-origin direct HKO fetch returned verified fresh context.
- Live production mobile flow passed at 390 × 844.
