# Sonality — Traceability Matrix

> Proves the suite is consistent and complete: **every** requirement maps to ≥1 task and ≥1
> test case, and nothing is built/tested that isn't required. If you change a requirement,
> update this matrix and follow the IDs to the affected task(s) and test(s).
> Sources: `01-requirements.md`, `03-tasks.md`, `04-test-strategy.md`.

## 1. Functional requirements → tasks → tests

| Req | Pri | Task(s) | Test case(s) |
|---|---|---|---|
| FR-01 Create person | MUST | T-06 | TC-R-01, TC-U-01, TC-E-01 |
| FR-02 List people + counts | MUST | T-06 | TC-R-01, TC-E-01 |
| FR-03 Edit person | MUST | T-06 | TC-R-01 |
| FR-04 Delete person (cascade) | MUST | T-06 | TC-R-02, TC-U-06 |
| FR-05 Archive person | SHOULD | T-07 | TC-R-04 |
| FR-06 Search/filter people | MUST | T-07 | TC-R-03 |
| FR-07 Add observation | MUST | T-08 | TC-R-05, TC-E-01 |
| FR-08 Timeline (date desc) | MUST | T-08 | TC-R-05 |
| FR-09 Edit observation | MUST | T-08 | TC-R-05 |
| FR-10 Delete observation | MUST | T-08 | TC-R-06, TC-U-06 |
| FR-11 Big Five evidence | MUST | T-09, T-04 | TC-D-01, TC-U-02, TC-E-01 |
| FR-12 MBTI evidence | MUST | T-09, T-04 | TC-D-02, TC-U-02, TC-E-02 |
| FR-13 0..n evidence per obs | MUST | T-04 | TC-D-01, TC-D-04 |
| FR-14 Remove one evidence item | SHOULD | T-09 | TC-U-02 |
| FR-15 Plain-language labels | SHOULD | T-09 | TC-U-02 |
| FR-16 Compute Big Five score | MUST | T-05, T-10 | TC-P-01–04, TC-E-01 |
| FR-17 Display Big Five (bars + null state + table alt) | MUST | T-10 | TC-P-02, TC-P-12, TC-U-03, TC-U-08 |
| FR-18 Compute MBTI type | MUST | T-05, T-11 | TC-P-05–08, TC-P-11, TC-E-02 |
| FR-19 Display MBTI + per-axis (confidence %) | MUST | T-11 | TC-P-05–08, TC-P-11, TC-U-04, TC-U-08, TC-E-02 |
| FR-20 "Why" → driving observations (+null state) | MUST | T-12 | TC-U-05, TC-U-07, TC-E-03 |
| FR-21 Evidence-strength indicator | SHOULD | T-10, T-12 | TC-P-01, TC-U-05 |
| FR-22 Export JSON | MUST | T-13 | TC-R-07, TC-E-04 |
| FR-23 Import JSON — Replace (validated) | MUST | T-13 | TC-R-07, TC-R-08, TC-E-04 |
| FR-24 Clear all data | SHOULD | T-13 | TC-R-09, TC-U-06 |
| FR-25 Import JSON — Merge by id | SHOULD | T-13 | TC-R-10, TC-R-11 |

## 2. Non-functional requirements → tasks → tests

| Req | Task(s) | Verification |
|---|---|---|
| NFR-01 Persistence across restart | T-02 | TC-R-01, TC-E-05 |
| NFR-02 Privacy / no telemetry | T-01 (no network code), T-16 gate | TC-N-01 |
| NFR-03 Offline | T-02 | TC-N-02 |
| NFR-04 Performance budgets | T-15 | TC-N-03 |
| NFR-05 Determinism | T-05 | TC-P-09, TC-P-10 |
| NFR-06 Referential integrity | T-04, T-08 | TC-D-08, TC-R-02, TC-R-06 |
| NFR-07 Accessibility | T-14 | TC-N-04, TC-U-03 (table alt) |
| NFR-08 Responsive | T-14 | TC-N-05 |
| NFR-09 Domain is UI-independent | T-05 | domain coverage gate (`04 §4`) + ESLint import-boundary rule (T-01) |
| NFR-10 Browser support | T-03, T-16 | TC-N-06 |

## 3. Coverage assertions

- **Every** FR-01…FR-24 and NFR-01…NFR-10 appears above with ≥1 task and ≥1 test → no orphan
  requirements.
- **Every** task T-01…T-16 in `03-tasks.md` is referenced by ≥1 requirement above, except the
  pure enablers **T-01** (scaffold) and **T-03** (test harness), which exist to make the others
  buildable/testable — this is intentional and noted here so they aren't flagged as orphan work.
- **Every** test case `TC-*` in `04-test-strategy.md` is referenced above.

## 4. Reverse check — tasks with no direct requirement (justified enablers)

| Task | Why it has no FR/NFR of its own |
|---|---|
| T-01 Scaffold | Enabler; its output is exercised by every other task |
| T-02 Data skeleton | Enabler for NFR-01 (tested there) and all repos |
| T-03 Test harness/CI | Enabler; makes NFR-09/10 and all tests runnable |
| T-16 DoD verification | Gate over all requirements, not a feature |

## 5. Open items that could still break consistency (tracked, none blocking)

| Item | Where | Status |
|---|---|---|
| **Local-first vs hosted** (A-02/A-03) | `00 §4` | **The one item that may need the user.** Assumption; non-blocking for the spec, but a true product fork if multi-device/sync is wanted |
| Merge import = SHOULD, not MUST (D-10) | `02 §10.4` | Replace (MUST) fully delivers backup/restore; user may promote Merge to MUST without redesign |
| Big Five chart = bars (D-11, was TQ-01) | `02 §9` | **Resolved** |
| Import merge algorithm (was TQ-02) | `02 §10` | **Resolved** — upsert by id, fully specified + tested |
| FR-05/14/15/21/24/25 are SHOULD | this matrix | Covered by tests but droppable from v1 without breaking any MUST |
