# Jeffrey PR #12 release review — 2026-09-10

Hudson requested safe completion of pending branches into production. This bounded
release fixes the existing per-device usage UI; it does not introduce the dirty
worktree's global usage service or credentials.

Found a runtime failure: reminder/app.js accesses updatedDate and usageTotal but
/reminder/ lacked both elements. Added them, aligned cache/version references with
ENGINE_VERSION, and labeled totals as per-device. Updated stale implementation/color
assertions and added route-element assertions so this regression is caught.

Validation: 14 Node tests and 5 Python tests pass; today/provenance validators pass;
JavaScript syntax and diff checks pass. Browser verification: root displays five cards;
mark used increments 0→1; unmark preserves count 1; remark and reload preserve 2;
/reminder/ loads five cards and the same count without the former null-element failure.
Test board date is historical (2026-08-09); no claim of fresh content is made.

Existing favourites/local storage are preserved. Global cross-device usage remains
out of scope. Rollback: reviewed revert of PR release changes, retaining stored counts
and existing content. No external data or credential migration.
