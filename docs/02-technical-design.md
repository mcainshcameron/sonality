# Sonality — Technical Design

> Traces to `00-overview-and-decisions.md` and `01-requirements.md`.
> Goal of this document: be precise enough that two engineers implementing from it
> independently would build the **same data model and the same profile algorithm**.

## 1. Architecture overview

Single-page web app, **local-first**, no server (`A-02`, `C-01`). Four layers, strict
one-way dependency (UI → domain/data; domain depends on nothing app-specific):

```
┌─────────────────────────────────────────────┐
│  UI layer (React components + pages + router) │  ← presentation only
├─────────────────────────────────────────────┤
│  Domain layer (pure TS, no React/DOM)         │  ← profile algorithm, validation (D-08, NFR-05/09)
├─────────────────────────────────────────────┤
│  Data-access layer (repositories)             │  ← CRUD, integrity, export/import
├─────────────────────────────────────────────┤
│  Persistence (IndexedDB via Dexie)            │  ← the only place that touches storage
└─────────────────────────────────────────────┘
```

Rules:
- The **domain layer** (`/src/domain`) is a pure library: it takes plain objects in, returns
  plain objects out, imports no React, DOM, or Dexie. This is what makes `FR-16`/`FR-18`/`NFR-05`
  trivially unit-testable.
- The **data layer** (`/src/data`) is the only code that imports Dexie. UI never touches Dexie
  directly; it calls repository functions.
- The **UI layer** (`/src/ui`) renders state and calls repositories + domain functions.

## 2. Technology stack (D-07, A-07)

| Concern | Choice | Why |
|---|---|---|
| Language | TypeScript (strict) | Type-safety enforces the data model at compile time |
| Framework | React 18 | Mature, testable, matches D-07 |
| Build/dev | Vite | Fast, first-class TS + Vitest integration |
| Routing | React Router v6 | Client-side routes for list/detail/settings |
| Persistence | Dexie.js over IndexedDB | Indexed, async, handles `A-06` scale; only storage dependency |
| Schema validation | Zod | Validate writes + import payloads (`NFR-06`, `FR-23`) |
| Charts | Recharts | Radar/bar for Big Five; declarative, testable |
| Styling | Tailwind CSS | Lightweight, no heavy component lib |
| IDs | `crypto.randomUUID()` | Built-in, no dependency |
| Unit/component tests | Vitest + React Testing Library | Same engine as Vite |
| E2E tests | Playwright | Cross-browser (`NFR-10`) |
| A11y check | `@axe-core/playwright` | Automates `NFR-07` |

No backend, no auth library, no network/HTTP client ship in v1 (`C-01`, `C-03`, `NFR-02`).

## 3. Data model

### 3.1 Enumerations (the controlled vocabulary)

```ts
type Framework = 'BIG_FIVE' | 'MBTI';

// Big Five dimensions
type BigFiveDimension = 'O' | 'C' | 'E' | 'A' | 'N';
// direction of a Big Five evidence item
type Direction = 1 | -1;          // +1 = high pole, -1 = low pole

// MBTI axes and their two poles
type MbtiAxis = 'EI' | 'SN' | 'TF' | 'JP';
type MbtiPole = 'E'|'I' | 'S'|'N' | 'T'|'F' | 'J'|'P';
//   EI → 'E' | 'I'   SN → 'S' | 'N'   TF → 'T' | 'F'   JP → 'J' | 'P'

type Weight = 1 | 2 | 3;          // 1 weak, 2 moderate, 3 strong
```

The **canonical Big Five order** is `[O, C, E, A, N]`.
The **canonical MBTI axis order** is `[EI, SN, TF, JP]`, and a type string is built by
concatenating the winning pole of each axis in that order (e.g. `I` + `N` + `T` + `J` = `INTJ`).

### 3.2 Entities

```ts
interface Person {
  id: string;            // uuid
  name: string;          // required, 1–120 chars, trimmed, non-empty
  relationship?: string; // optional free text, ≤ 60 chars
  notes?: string;        // optional free text, ≤ 5000 chars
  archived: boolean;     // default false
  createdAt: string;     // ISO-8601 UTC
  updatedAt: string;     // ISO-8601 UTC
}

interface Observation {
  id: string;            // uuid
  personId: string;      // FK → Person.id (required, must exist)
  text: string;          // required, 1–5000 chars, trimmed, non-empty
  occurredOn: string;    // ISO-8601 date (YYYY-MM-DD); default = the user's LOCAL calendar
                         // date at create time (not UTC). Any valid date accepted; no
                         // future/past constraint in v1. Date-only — no time component.
  createdAt: string;     // ISO-8601 UTC
  updatedAt: string;     // ISO-8601 UTC
}

interface Evidence {
  id: string;            // uuid
  observationId: string; // FK → Observation.id (required, must exist)
  framework: Framework;
  // Exactly one framework-specific shape is populated, enforced by Zod discriminated union:
  // when framework === 'BIG_FIVE':
  dimension?: BigFiveDimension;
  direction?: Direction;
  // when framework === 'MBTI':
  axis?: MbtiAxis;
  pole?: MbtiPole;       // must be one of the two poles valid for `axis`
  // common:
  weight: Weight;        // required
}
```

Validation rules (enforced by Zod before every write, `NFR-06`):
- A `BIG_FIVE` evidence item MUST have `dimension` + `direction`, MUST NOT have `axis`/`pole`.
- An `MBTI` evidence item MUST have `axis` + `pole`, the `pole` MUST belong to that `axis`
  (e.g. `axis:'EI'` ⇒ `pole ∈ {'E','I'}`), MUST NOT have `dimension`/`direction`.
- All FKs must reference existing rows. Deleting a parent cascades (see §4).

### 3.3 Storage schema (Dexie / IndexedDB)

Three object stores; `&` = primary key, `*`/plain = secondary index:

```
people:       &id, name, archived, updatedAt
observations: &id, personId, occurredOn, updatedAt
evidence:     &id, observationId, framework
meta:         &key            // { key:'schemaVersion', value:1 }, app singletons
```

Indexes chosen for the hot queries: people-by-archived (list/filter `FR-02/05/06`),
observations-by-person (timeline `FR-08`), evidence-by-observation (profile compute `FR-16/18`).

### 3.4 Profile (derived — never stored, `D-05`, `NFR-05`)

```ts
interface DimensionScore {
  dimension: BigFiveDimension;
  score: number | null;     // 0–100, or null when no evidence ("insufficient data", FR-17)
  evidenceCount: number;    // # contributing observations
  totalWeight: number;      // Σ|weight| of contributing evidence (strength, FR-21)
}

interface AxisResult {
  axis: MbtiAxis;
  winner: MbtiPole | null;  // null when tied or no evidence
  tally: Record<MbtiPole, number>;  // weighted votes per pole on this axis
  confidence: number | null;        // 0–1, null when no evidence
  status: 'decided' | 'tie' | 'no-data';
}

interface Profile {
  personId: string;
  bigFive: DimensionScore[];        // length 5, canonical order O,C,E,A,N
  mbti: {
    type: string;                   // 4 chars, '?' for undecided axes, e.g. 'IN?J'
    complete: boolean;              // false if any axis tie/no-data
    axes: AxisResult[];             // length 4, canonical order EI,SN,TF,JP
  };
}
```

## 4. Referential integrity & cascades (NFR-06)

All multi-store mutations run inside a single Dexie transaction:
- **Delete person** → delete the person, all their observations, and all evidence of those
  observations, atomically (`FR-04`).
- **Delete observation** → delete the observation and its evidence atomically (`FR-10`).
- **Create/update evidence** → reject if `observationId` missing; reject if `pole`/`axis`
  mismatch or framework shape invalid.
- After any delete, an integrity invariant holds: *no observation references a missing person,
  and no evidence references a missing observation.* This invariant is asserted in tests.

## 5. Profile computation specification (the contract — implement EXACTLY)

All inputs are the set `E` of evidence items belonging to one person (joined via that person's
observations). Pure function `computeProfile(personId, evidence[]) → Profile`. No clock, no RNG.

### 5.1 Big Five dimension score (FR-16, FR-17)

For each dimension `d ∈ {O,C,E,A,N}`:

1. Let `Ed` = evidence items with `framework='BIG_FIVE'` and `dimension=d`.
2. If `Ed` is empty → `score = null`, `evidenceCount = 0`, `totalWeight = 0`. **Stop.**
3. `signed   = Σ (direction_i × weight_i)` for `i ∈ Ed`.   // can be negative
4. `maxAbs   = Σ weight_i`                  for `i ∈ Ed`.   // always > 0 here
5. `score    = round( 50 + 50 × (signed / maxAbs) )`.       // integer in [0, 100]
   - `round` = round-half-up (`Math.round`).
   - Bounds are guaranteed: `signed ∈ [−maxAbs, +maxAbs]` ⇒ `score ∈ [0, 100]`.
6. `evidenceCount = |Ed|`, `totalWeight = maxAbs`.

**Worked example.** Dimension E with evidence `(+1,w3), (+1,w1), (-1,w2)`:
`signed = 3 + 1 − 2 = 2`; `maxAbs = 3 + 1 + 2 = 6`; `score = round(50 + 50×(2/6)) = round(66.67) = 67`.
Interpretation: leans toward high Extraversion, moderate strength (3 observations, weight 6).

**No-evidence example.** Dimension N with no evidence → `score = null` → UI shows
"insufficient data" (NOT 50), satisfying `FR-17`.

### 5.2 MBTI axis result & type (FR-18, FR-19)

For each axis `a ∈ {EI, SN, TF, JP}` with poles `(p1, p2)` in canonical letter order
(`EI→(E,I)`, `SN→(S,N)`, `TF→(T,F)`, `JP→(J,P)`):

1. Let `Ea` = evidence with `framework='MBTI'` and `axis=a`.
2. `tally[p1] = Σ weight_i` for items with `pole=p1`; `tally[p2]` likewise. (0 if none.)
3. `total = tally[p1] + tally[p2]`.
4. If `total == 0` → `status='no-data'`, `winner=null`, `confidence=null`.
5. Else if `tally[p1] == tally[p2]` → `status='tie'`, `winner=null`,
   `confidence = 0`.
6. Else → `status='decided'`, `winner = argmax pole`,
   `confidence = |tally[p1] − tally[p2]| / total`  (a value in (0, 1]).

**Type assembly:** for axes in canonical order `[EI, SN, TF, JP]`, take each axis's `winner`
letter, or `'?'` if `winner` is null. Concatenate the four. `complete = true` iff every axis
`status === 'decided'`.

**Worked example.** Evidence: EI→ E(w2), I(w1); SN→ N(w3); TF→ (none); JP→ J(w1), J(w2):
- EI: tally E=2, I=1 → winner `E`, confidence 1/3 ≈ 0.33, decided.
- SN: tally N=3 → winner `N`, confidence 1, decided.
- TF: no data → `?`.
- JP: tally J=3 → winner `J`, confidence 1, decided.
- Type = `EN?J`, `complete = false`.

**Single-pole edge case (must be handled this exact way).** If an axis has evidence for only
one pole, e.g. `E(w3), I(none)`: `total = 3`, tallies differ ⇒ `status='decided'`, `winner=E`,
`confidence = |3 − 0| / 3 = 1.0`. This is intentional: confidence measures **how consistent the
recorded evidence is**, not how *much* there is. Sample size / strength is conveyed separately
by `totalWeight` (see `FR-21`). So one strong observation yields a confident-but-thin axis, and
the UI distinguishes the two via the strength indicator. Asserted in `TC-P-11`.

**Representation & display.** `confidence` is stored as a float in `[0, 1]`. The MBTI view
(`FR-19`) renders it as a **percentage rounded to the nearest integer** (`Math.round(conf*100)`,
e.g. `1/3 → 33%`, `1.0 → 100%`). Rounding is for display only; the stored value is the exact
float, keeping `computeProfile` deterministic.

### 5.3 Determinism guarantees (NFR-05)

- No `Date.now()`/`Math.random()` inside `computeProfile`.
- Iteration order over evidence does not affect results (only sums and comparisons are used).
- Therefore identical evidence ⇒ identical `Profile` on any machine/run.

## 6. Component & module map

```
src/
  domain/
    types.ts            // all interfaces/enums from §3
    profile.ts          // computeProfile() — §5; the single source of truth
    labels.ts           // human-readable labels/hints for dims/axes/poles (FR-15)
    schema.ts           // Zod schemas for Person/Observation/Evidence + Export payload
  data/
    db.ts               // Dexie instance + store definitions (§3.3)
    people.repo.ts      // CRUD + search/filter/archive (FR-01..06)
    observations.repo.ts// CRUD + timeline query (FR-07..10)
    evidence.repo.ts    // CRUD per observation (FR-11..14)
    portability.ts      // export/import/clear with validation (FR-22..24)
    integrity.ts        // cascade helpers + invariant checks (§4, NFR-06)
  ui/
    App.tsx, router.tsx
    pages/
      PeopleListPage.tsx     // FR-02, FR-06
      PersonDetailPage.tsx   // FR-03..05, FR-08, FR-16..21
      SettingsPage.tsx       // FR-22..24
    components/
      PersonForm.tsx          // FR-01, FR-03
      ObservationEditor.tsx   // FR-07, FR-09, FR-11..15
      EvidencePicker.tsx      // FR-11, FR-12, FR-15
      BigFiveChart.tsx        // FR-17 (+ table alt for NFR-07)
      MbtiTypeView.tsx        // FR-19, FR-20
      EvidenceBreakdown.tsx   // FR-20, FR-21
      ConfirmDialog.tsx       // FR-04, FR-10, FR-24
  main.tsx, index.css
```

Key principle: `domain/profile.ts` is imported by `BigFiveChart`, `MbtiTypeView`, and the
profile tests — UI and tests consume the **same** function, so what's tested is what ships.

## 7. Routing & state

- Routes: `/` (people list), `/people/:id` (detail), `/settings`.
- No global state library needed for v1; pages load via repositories and hold local React
  state. A lightweight `useLiveQuery` (Dexie React hook) keeps lists reactive to writes.
- Profiles are derived by calling `computeProfile` **during render**, wrapped in `useMemo`
  keyed on the person's evidence (each item's `id` + `updatedAt`). "Computed on render" and
  "memoized" are not in conflict: `useMemo` runs during render but **caches between renders**
  while the keyed evidence is unchanged, so a profile recomputes only when its evidence changes.
  This both satisfies `NFR-05` (pure recompute from evidence) and keeps `NFR-04` render budgets.

## 8. Error handling

- All repository writes validate with Zod; failures surface as inline form errors (`FR-01/07`)
  — never a silent drop.
- Import validates the entire payload **before** writing anything; on any error it aborts with
  no partial state (`FR-23`).
- IndexedDB unavailable (e.g. private mode quirks) → app shows a blocking, explanatory banner
  rather than failing silently.

## 9. Resolved technical decisions (previously open)

- **TQ-01 → resolved (D-11):** Big Five chart = **horizontal bars** for v1 (clearest for the
  null "insufficient data" state). Radar is a deferred COULD. Satisfies `FR-17`.
- **TQ-02 → resolved (D-10):** Import supports two explicit modes — **Replace** (the v1 MUST,
  `FR-23`) and **Merge** (a SHOULD, `FR-25`). The merge algorithm is now fully specified in §10.

## 10. Import / export specification (FR-22, FR-23, FR-25)

### 10.1 Export payload (FR-22)

A single JSON document:

```jsonc
{
  "schemaVersion": 1,
  "exportedAt": "<ISO-8601 UTC>",   // stamped by the UI at export time (informational only)
  "people":       [ /* every Person row, verbatim incl. id + timestamps */ ],
  "observations": [ /* every Observation row, verbatim */ ],
  "evidence":     [ /* every Evidence row, verbatim */ ]
}
```

The whole payload is validated by a Zod `ExportPayload` schema on import (`schema.ts`).

### 10.2 Validation gate (applies to BOTH import modes — FR-23, NFR-06)

Before **any** write, the entire payload is validated; on **any** failure the import aborts
with a clear error and **zero** writes (all-or-nothing). Validation checks:
1. `schemaVersion === 1` (else reject with a version-mismatch message).
2. Every Person / Observation / Evidence row passes its entity Zod schema (§3.2).
3. **Referential closure within the resulting dataset:** after the import is applied (see
   per-mode rules below), every `observation.personId` resolves to a person and every
   `evidence.observationId` resolves to an observation. If any reference would dangle → reject.

### 10.3 Replace mode (FR-23, MUST)

1. Validate per §10.2 (treating the import as the *entire* resulting dataset).
2. In one Dexie transaction: **delete all** existing rows, then insert every imported row
   **verbatim** — preserving `id`, `createdAt`, and `updatedAt` exactly as in the file.
3. Result: local state is byte-identical to the exported file. `export → replace-import` is
   **lossless** and the basis for the round-trip test (`TC-R-07`).

### 10.4 Merge mode (FR-25, SHOULD)

Identity is the primary `id` (a UUID). Merge is a deterministic **upsert by id** — never a
name match (two people named "Alex" stay distinct):

1. Validate per §10.2, where the *resulting dataset* = (local rows) ∪ (imported rows) with
   imported rows replacing same-id local rows.
2. In one Dexie transaction, for each imported row of each store:
   - if a local row with the same `id` exists → **overwrite** it with the imported row
     (**imported wins** on conflict);
   - else → **insert** it.
3. **Timestamps are preserved from the imported file** (not reset to "now"), so
   `export → clear → merge-import` restores the original state exactly. Determinism intact.
4. If §10.2 referential closure fails (e.g. an imported observation names a `personId` that
   exists neither locally nor in the file) → reject the whole import, no partial write.

**Worked merge example.** Local = `[Person p1 "Alice"]`. Import = `[Person p1 "Alicia",
Person p2 "Bob"]` → after merge: `p1` becomes "Alicia" (overwritten), `p2` "Bob" inserted;
total 2 people. Deterministic and asserted in `TC-R-10`.

**Open product note (non-blocking):** Merge is scoped as a **SHOULD** for v1 because Replace
alone fully delivers backup/restore (`US-07`). If the user wants merge promoted to a v1 MUST,
that is a scope decision recorded against `D-10`, not a redesign.

## 11. Canonical trait labels (FR-15 — the content of `labels.ts`)

These exact strings are the single source for the UI pickers and breakdowns, so two engineers
produce the same labels. Weight labels: `1` = "weak signal", `2` = "moderate signal",
`3` = "strong signal".

**Big Five** (each dimension, high `+1` pole / low `-1` pole):

| Dim | High pole (`+1`) | Low pole (`-1`) |
|---|---|---|
| O | Open — curious, imaginative, novelty-seeking | Conventional — practical, routine-preferring |
| C | Conscientious — organized, dependable, disciplined | Flexible — spontaneous, easy-going about structure |
| E | Extraverted — outgoing, energized by people | Introverted — reserved, energized by solitude |
| A | Agreeable — compassionate, cooperative, trusting | Detached — skeptical, competitive, blunt |
| N | Reactive — prone to stress, worry, mood swings | Calm — emotionally stable, even-keeled |

**MBTI** (each axis, both poles):

| Axis | Pole 1 | Pole 2 |
|---|---|---|
| EI | E — Extraversion: energized by people/action | I — Introversion: energized by solitude/reflection |
| SN | S — Sensing: concrete, detail- and fact-focused | N — Intuition: abstract, pattern- and possibility-focused |
| TF | T — Thinking: decides by logic and consistency | F — Feeling: decides by values and impact on people |
| JP | J — Judging: prefers planning and closure | P — Perceiving: prefers flexibility and openness |

Labels are descriptive aids only; they do not affect the algorithm (`A-08`).
