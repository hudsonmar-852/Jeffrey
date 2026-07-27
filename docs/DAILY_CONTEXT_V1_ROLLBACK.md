# Daily Context v1 migration and rollback

Version: 4.1
Human review: required before merge

The dashboard reads `/Jeffrey/config/runtime.json`. When
`AIOS_DAILY_CONTEXT_V1` is `true`, it loads the latest stored AIOS context and
catalogue pointers. It prepends scheduled drafts in memory and preserves all
existing localStorage keys and reminder objects.

To roll back:

1. Set `AIOS_DAILY_CONTEXT_V1` to `false`.
2. Revert the v4.1 commit if a code rollback is required.
3. Do not clear localStorage or remove historical catalogues.
4. Confirm the v4.0 relationship panel and v3.5 catalogue still load.
