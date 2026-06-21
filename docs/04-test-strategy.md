# Sonality — Test Strategy

> Every requirement in `01-requirements.md` maps to ≥1 concrete test case here, and every
> test case names the requirement(s) it proves. The traceability matrix (`05-…md`) is the
> cross-check. Test IDs: `TC-D-*` domain schema, `TC-P-*` profile algorithm, `TC-R-*`
> repository/data, `TC-U-*` UI/component, `TC-E-*` end-to-end, `TC-N-*` non-functional.

## 1. Test pyramid & where each requirement is verified

| Level | Tooling | Verifies | Bulk of coverage |
|---|---|---|---|
| **Domain (unit)** | Vitest | profile algorithm, schemas (`FR-16/18`, `NFR-05/06`) | **Most tests live here** — pure, fast, deterministic |
| **Data (integration)** | Vitest + fake-indexeddb | repositories, cascades, portability (`FR-01..14,22..24`, `NFR-01/06`) | Medium |
| **Component** | Vitest + RTL | forms, pickers, charts render & validate (`FR-*` UI) | Medium |
| **E2E** | Playwright | full user journeys, offline, a11y, browsers (`NFR-02/03/07/10`) | Few, high-value |
| **Performance** | Playwright + seed | render budgets (`NFR-04`) | 1–2 targeted |

Principle (`D-08`): the domain layer carries the highest-value tests because it is pure and
holds the algorithm that defines the product's correctness.

## 2. Domain test cases

### 2.1 Schema validation — `TC-D-*` (FR-11–13, NFR-06)

| ID | Input | Expected |
|---|---|---|
| TC-D-01 | Valid Big Five evidence `{BIG_FIVE, dimension:'O', direction:1, weight:2}` | accepted |
| TC-D-02 | Valid MBTI evidence `{MBTI, axis:'EI', pole:'I', weight:3}` | accepted |
| TC-D-03 | MBTI evidence with `axis:'EI', pole:'S'` (pole not on axis) | **rejected** |
| TC-D-04 | BIG_FIVE evidence carrying an `axis` field | **rejected** |
| TC-D-05 | `weight: 4` or `0` | **rejected** |
| TC-D-06 | Person with empty/whitespace name | **rejected** |
| TC-D-07 | Observation text > 5000 chars | **rejected** |
| TC-D-08 | Evidence with non-existent `observationId` (integrity check) | **rejected** at write |

### 2.2 Profile algorithm — `TC-P-*` (FR-16–19, NFR-05)

| ID | Scenario | Expected (per `02 §5`) |
|---|---|---|
| TC-P-01 | Big Five E: `(+1,3),(+1,1),(-1,2)` | score **67**, count 3, weight 6 |
| TC-P-02 | Big Five dimension with no evidence | score **null** (insufficient data, NOT 50) |
| TC-P-03 | Big Five all `+1` weights | score **100** |
| TC-P-04 | Big Five balanced `(+1,2),(-1,2)` | score **50** |
| TC-P-05 | MBTI EI: `E(2), I(1)` | winner `E`, confidence 1/3, decided |
| TC-P-06 | MBTI axis tie `T(2), F(2)` | status `tie`, winner null, type letter `?`, complete=false |
| TC-P-07 | MBTI axis no evidence | status `no-data`, letter `?` |
| TC-P-08 | Full type from `02 §5.2` worked example | type `EN?J`, complete=false |
| TC-P-09 | Same evidence shuffled into different array orders | **identical** Profile (order-independence) |
| TC-P-10 | `computeProfile` called twice with same input | byte-identical output (no clock/RNG) |
| TC-P-11 | MBTI single-pole `E(3), I(0)` | status `decided`, winner `E`, confidence **1.0** → displays **100%** (`02 §5.2` edge case) |
| TC-P-12 | Big Five all `-1` weights, e.g. `(-1,2),(-1,1)` | score **0** (lower bound) |

## 3. Data, component, E2E & NFR test cases

### 3.1 Repository / data — `TC-R-*`

| ID | Verifies | Check |
|---|---|---|
| TC-R-01 | FR-01–03 | create/read/update person persists across a simulated reload |
| TC-R-02 | FR-04, NFR-06 | delete person cascades to observations + evidence; orphan invariant holds |
| TC-R-03 | FR-06 | search-by-name + relationship filter return correct subset |
| TC-R-04 | FR-05 | archived person excluded from default list, restorable |
| TC-R-05 | FR-07–10 | observation CRUD + timeline ordered by `occurredOn` desc |
| TC-R-06 | FR-10, NFR-06 | delete observation removes its evidence only |
| TC-R-07 | FR-22/23 | export → **Replace**-import round-trip yields a byte-identical data set (ids + timestamps preserved) |
| TC-R-08 | FR-23 | importing a corrupt/invalid file (bad JSON, wrong `schemaVersion`, schema violation) aborts with **no** partial write |
| TC-R-09 | FR-24 | clear-all empties every store |
| TC-R-10 | FR-25 | **Merge**-import upserts by id: same-id local row overwritten (imported wins), new-id row inserted, timestamps preserved (`02 §10.4` worked example) |
| TC-R-11 | FR-25, NFR-06 | Merge-import whose payload would dangle a reference (observation's `personId` absent locally and in file) is **rejected** with no partial write |

### 3.2 Component — `TC-U-*`

| ID | Verifies | Check |
|---|---|---|
| TC-U-01 | FR-01 | PersonForm blocks empty name with inline error |
| TC-U-02 | FR-11/12/15 | EvidencePicker offers only valid poles per axis; shows labels/hints |
| TC-U-03 | FR-17 | BigFiveChart renders "insufficient data" for a null dimension |
| TC-U-04 | FR-19 | MbtiTypeView renders `?` for undecided axis + "incomplete" flag |
| TC-U-05 | FR-20 | EvidenceBreakdown lists the exact contributing observations on expand |
| TC-U-06 | FR-04/10/24 | ConfirmDialog required before destructive action; cancel is a no-op |
| TC-U-07 | FR-20 | Expanding a **null** Big Five dimension shows "No observations tagged for this yet"; expand control still present |
| TC-U-08 | FR-17/19 | BigFiveChart exposes a table alternative; MbtiTypeView renders confidence as an integer % |

### 3.3 End-to-end — `TC-E-*`

| ID | Verifies | Journey |
|---|---|---|
| TC-E-01 | FR-01,07,11,16,17 | Add person → add observation with Big Five evidence → see correct score |
| TC-E-02 | FR-12,18,19 | Add MBTI evidence across axes → see assembled type + per-axis confidence |
| TC-E-03 | FR-20 | Expand a dimension → land on the driving observations |
| TC-E-04 | FR-22/23 | Export, clear, re-import → state restored |
| TC-E-05 | NFR-01 | Reload mid-session → data intact |

### 3.4 Non-functional — `TC-N-*`

| ID | Verifies | Check |
|---|---|---|
| TC-N-01 | NFR-02 | No outbound network requests during a full core-flow session (only static assets) |
| TC-N-02 | NFR-03 | Core flows succeed with network disabled |
| TC-N-03 | NFR-04 | Seeded 500 people / 10k observations: list & profile render < 500 ms |
| TC-N-04 | NFR-07 | Core flows completed keyboard-only; axe = no critical violations |
| TC-N-05 | NFR-08 | No layout breakage 1024→768 px on list/detail/settings |
| TC-N-06 | NFR-10 | E2E suite green on a Chromium **and** a WebKit/Firefox target |

## 4. Coverage targets & gates

| Layer | Line-coverage target | Gate |
|---|---|---|
| `domain/` (profile + schema) | **≥ 95%** | CI fails below threshold (this is the correctness core) |
| `data/` (repositories) | ≥ 85% | CI warning below |
| `ui/` | ≥ 70% | CI warning below |
| E2E | All `TC-E-*` + `TC-N-*` must pass | CI fails on any failure |

## 5. Test data & fixtures

- **Canonical evidence fixtures** mirror every worked example in `02 §5` so the spec and the
  tests cannot silently diverge — if the algorithm doc changes, these fixtures must change too.
- **Seed/large-dataset script** generates the `A-06` scale dataset deterministically (fixed,
  in-script pseudo data — no randomness) for `TC-N-03`.
- **fake-indexeddb** backs repository tests so they run in Node without a browser.

## 6. What is intentionally NOT tested in v1

- Multi-user / sync / auth (out of scope, `D-09`) — no tests.
- AI inference (`D-03` excludes it) — no tests.
- Cross-device migration beyond JSON export/import.

These exclusions are deliberate and listed so "untested" is never mistaken for "missed".
