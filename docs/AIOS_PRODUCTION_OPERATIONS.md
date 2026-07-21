# Jeffrey AIOS Production Operations

## Daily Run

The scheduled workflow runs at 07:15 Hong Kong time. Operators can also use **Actions → Daily AIOS Content → Run workflow**.

## Source Policy

Only source responses obtained during the run can create live facts. Each generated card links to its source and records its source timestamp. Creative wording is separated from official facts and no diagnosis or guaranteed outcome is generated.

## Dashboard Workflow

1. Check the Production Sources panel for freshness and failures.
2. Open the source link and verify the claim.
3. Select **Approve**.
4. Select **Copy** and publish manually to the intended audience.
5. Select **Done**.
6. Use **Export Audit JSON** when an external record is required.

Approval and completion are stored in the current browser. Clearing browser storage removes them, so export before clearing data or changing devices.

## Failure and Recovery

- Both HKO sources fail: no new production data is written; last known good data remains live.
- Optional government RSS fails: weather content is still generated and source health shows the failure.
- Validation fails: no commit and no deployment.
- Bad production commit: revert that commit through a reviewed pull request; do not hand-edit generated facts.

## Distribution Boundary

WhatsApp and Instagram auto-distribution are disabled. Enabling either requires an RFC covering credentials, consent, audience selection, rate limits, audit trail, platform policy and a human approval gate.
