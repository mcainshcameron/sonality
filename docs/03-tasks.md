# Sonality — Implementation Tasks

> Each task has: an ID, the requirements it satisfies, dependencies, and **its own
> testable acceptance criteria**. A task is "done" only when its criteria pass AND the
> referenced tests (`04-test-strategy.md`) are green. Order respects dependencies.

## 1. Milestones

| Milestone | Tasks | Outcome |
|---|---|---|
| **M0 — Foundation** | T-01…T-03 | App builds, data layer + domain types exist, CI runs tests |
| **M1 — Domain core** | T-04…T-05 | Profile algorithm + validation, fully unit-tested (the riskiest logic, done first) |
| **M2 — People & observations** | T-06…T-09 | Full CRUD with persistence |
| **M3 — Profiles & viz** | T-10…T-12 | Profiles computed and visualized with "why" |
| **M4 — Portability & polish** | T-13…T-15 | Export/import, a11y, performance |
| **M5 — Release gate** | T-16 | Definition of Done met |

## 2. Tasks

### M0 — Foundation

**T-01 — Project scaffold**
- Satisfies: enabler for all · Deps: none
- Do: Vite + React + TS (strict) + Tailwind; ESLint/Prettier; folder structure per `02 §6`.
- Acceptance: `npm run dev` serves a blank app; `npm run build` and `npm run lint` pass; strict TS on.

**T-02 — Persistence & data layer skeleton**
- Satisfies: NFR-01 · Deps: T-01
- Do: Dexie DB with stores per `02 §3.3`; `meta.schemaVersion=1`; empty repo modules.
- Acceptance: writing a row and reloading the page returns it; schema version is readable.

**T-03 — Test harness & CI**
- Satisfies: enabler for NFR-09 · Deps: T-01
- Do: Vitest + RTL + Playwright + axe configured; one trivial test per layer green; CI script.
- Acceptance: `npm test` (unit) and `npm run e2e` both run and pass locally/CI.

### M1 — Domain core (do before UI)

**T-04 — Domain types & Zod schemas**
- Satisfies: FR-11–13, NFR-06 · Deps: T-01
- Do: implement `domain/types.ts`, `domain/schema.ts` (discriminated union for Evidence,
  pole↔axis validation, field bounds per `02 §3.2`).
- Acceptance: schema accepts every valid shape and rejects each invalid one (wrong pole for
  axis, BIG_FIVE with an axis, empty name, over-length text) — proven by `TC-D-*` tests.

**T-05 — `computeProfile()` implementation**
- Satisfies: FR-16, FR-18, NFR-05 · Deps: T-04
- Do: implement `domain/profile.ts` EXACTLY per `02 §5` (Big Five formula, MBTI tally, type
  assembly, null/tie handling). Pure, no clock/RNG.
- Acceptance: matches every worked example in `02 §5`; passes the full `TC-P-*` table incl.
  no-evidence (null, not 50), ties (`?` + incomplete), and the determinism/order-independence test.

### M2 — People & observations

**T-06 — People repository + CRUD UI**
- Satisfies: FR-01–04 · Deps: T-02, T-04
- Do: `people.repo.ts`; `PeopleListPage`, `PersonForm`, `ConfirmDialog`.
- Acceptance: create (name required), list with observation counts, edit, delete-with-confirm
  all work and persist; empty name rejected inline.

**T-07 — Search, filter, archive**
- Satisfies: FR-05, FR-06 · Deps: T-06
- Do: name search, relationship filter, archive/unarchive; archived excluded from default list.
- Acceptance: query/filter narrow the list correctly; archived people hidden by default,
  restorable, excluded from counts.

**T-08 — Observations repository + timeline UI**
- Satisfies: FR-07–10 · Deps: T-06
- Do: `observations.repo.ts`; timeline on `PersonDetailPage`; `ObservationEditor` (text + date).
- Acceptance: add (text required, date defaults today), newest-first timeline, edit, delete-
  with-confirm; cascade verified (deleting person removes observations).

**T-09 — Evidence picker + persistence**
- Satisfies: FR-11–15 · Deps: T-08, T-04
- Do: `EvidencePicker` for Big Five (dim/direction/weight) and MBTI (axis/pole/weight);
  human-readable labels (`labels.ts`); add/remove multiple evidence per observation.
- Acceptance: evidence saves and reloads; invalid combos impossible via UI; labels/hints shown;
  an observation with zero evidence is valid.

### M3 — Profiles & visualization

**T-10 — Big Five visualization**
- Satisfies: FR-16, FR-17, FR-21 · Deps: T-05, T-09
- Do: `BigFiveChart` rendering five scores from `computeProfile`; "insufficient data" state for
  null; strength indicator; text/table alternative (NFR-07).
- Acceptance: scores match the algorithm; no-evidence dimension shows "insufficient data" not 50;
  table alternative present.

**T-11 — MBTI type view**
- Satisfies: FR-18, FR-19 · Deps: T-05, T-09
- Do: `MbtiTypeView` showing the 4-letter type, per-axis split + confidence, `?`/"no data"/tie.
- Acceptance: type and per-axis values match the algorithm; incomplete types flagged.

**T-12 — Evidence "why" breakdown**
- Satisfies: FR-20, FR-21 · Deps: T-10, T-11
- Do: `EvidenceBreakdown` linking each dimension/axis to its contributing observations + the
  evidence (direction/pole, weight).
- Acceptance: expanding a dimension/axis lists exactly the observations whose evidence drove it.

### M4 — Portability & polish

**T-13 — Export / import / clear**
- Satisfies: FR-22–25, NFR-06 · Deps: T-09
- Do: `portability.ts`; export versioned JSON (`02 §10.1`); **Replace** import (`02 §10.3`,
  MUST) and **Merge**-by-id import (`02 §10.4`, SHOULD), both behind the full Zod validation
  gate (`02 §10.2`, all-or-nothing); clear-all with strong confirm.
- Acceptance: export→clear→Replace-import round-trips byte-identically; Merge-import upserts by
  id per the §10.4 example; corrupt or dangling-reference file rejected with no partial write;
  `schemaVersion` present and checked.

**T-14 — Accessibility & responsive pass**
- Satisfies: NFR-07, NFR-08 · Deps: M2–M3
- Do: labels, keyboard operability, focus management in dialogs, chart alt; layout 1024→768 px.
- Acceptance: core flows keyboard-only; axe reports no critical issues; no layout breakage in range.

**T-15 — Performance pass**
- Satisfies: NFR-04 · Deps: M2–M3
- Do: seed script for `A-06` scale; verify list & profile render budgets; memoize profile compute.
- Acceptance: People list and a Person profile each render < 500 ms on the seeded dataset.

### M5 — Release gate

**T-16 — Definition of Done verification**
- Satisfies: all · Deps: T-01…T-15
- Do: run the DoD checklist (§4); confirm traceability matrix has no gaps.
- Acceptance: every box in §4 ticked; `05-traceability-matrix.md` shows every FR/NFR covered by
  ≥1 task and ≥1 passing test.

## 3. Dependency graph (text)

```
T-01 ─┬─ T-02 ─┬─ T-06 ─┬─ T-07
      │        │        └─ T-08 ─ T-09 ─┬─ T-10 ─┐
      ├─ T-03  │                        ├─ T-11 ─┼─ T-12
      └─ T-04 ─┴─ T-05 ─────────────────┘        │
                         T-09 ─ T-13             │
                         (M2–M3) ─ T-14, T-15    │
                              all ─ T-16 ────────┘
```

## 4. Definition of Done (release gate for v1)

A v1 is "done" when **all** of the following hold:

- [ ] **Scope:** every **MUST** requirement in `01-requirements.md` is implemented (SHOULD/COULD
      tracked but not blocking).
- [ ] **Traceability:** `05-traceability-matrix.md` shows every `FR-`/`NFR-` mapped to ≥1 task
      and ≥1 **passing** test; no row is empty.
- [ ] **Domain correctness:** `computeProfile` and Zod schemas pass 100% of `TC-D-*`/`TC-P-*`;
      domain-layer line coverage ≥ 95% (`04 §4`).
- [ ] **Determinism:** the order-independence + cross-run determinism test passes (`NFR-05`).
- [ ] **Integrity:** cascade-delete and orphan-invariant tests pass (`NFR-06`).
- [ ] **Persistence/offline:** add-reload-restart and offline tests pass (`NFR-01`, `NFR-03`).
- [ ] **Portability:** export→import round-trip is lossless; corrupt-import is safely rejected.
- [ ] **A11y:** axe reports no critical violations; all core flows keyboard-completable (`NFR-07`).
- [ ] **Performance:** `NFR-04` budgets met on the seeded large dataset.
- [ ] **Privacy:** no outbound network calls during normal use (`NFR-02`).
- [ ] **Quality gates:** `lint`, type-check, unit, component, and e2e suites all green in CI.
- [ ] **Docs current:** any decision/assumption changed during build is reflected in `00-…md`
      and its change log.
