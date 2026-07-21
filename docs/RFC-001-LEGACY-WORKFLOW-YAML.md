# RFC-001: Retire Legacy Self-Patching Workflows

- **Status:** Proposed
- **Detected:** 2026-07-21

## Problem

`.github/workflows/fix-bible-render.yml` contains a multi-line Python string whose indentation is invalid YAML. It is a historical self-patching workflow and is unrelated to the approved AIOS production pipeline.

## Proposal

Remove both historical self-patching workflows after confirming their patches already exist in `bible.html`. Future Bible changes should use normal reviewed pull requests and the Pages validation/deployment workflow.

## Decision Boundary

This implementation does not alter or execute the legacy workflow. The new `daily-content.yml` and updated `pages.yml` parse independently and do not depend on it.
