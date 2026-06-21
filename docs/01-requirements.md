# Sonality — Requirements

> Traces to decisions/assumptions in `00-overview-and-decisions.md`.
> Each requirement has a stable ID, a priority (**MUST** / **SHOULD** / **COULD** for v1),
> and **testable** acceptance criteria written in Given/When/Then form.
> IDs are referenced by tasks (`03-tasks.md`) and tests (`04-test-strategy.md`).

## 1. Personas & primary user stories

There is one persona: **the Analyst** (the single user, see `A-01`).

| ID | As the Analyst, I want to… | …so that |
|---|---|---|
| US-01 | add and maintain a list of people I know | I have a roster of subjects to profile |
| US-02 | log dated observations of someone's behaviour | I capture evidence over time, not just impressions |
| US-03 | tag each observation with the traits it signals | behaviour is linked to well-understood frameworks |
| US-04 | see a computed personality profile per person | I can read their Big Five + MBTI at a glance |
| US-05 | understand *why* a profile says what it says | I trust it and can revisit the underlying evidence |
| US-06 | find and organize people quickly | the tool stays usable as the roster grows |
| US-07 | back up and move my data | I never lose my notes and control where they live |

## 2. Functional requirements

### 2.1 People management (US-01, US-06)

| ID | Pri | Requirement | Acceptance criteria (Given/When/Then) |
|---|---|---|---|
| **FR-01** | MUST | Create a person with a required **name** and optional **relationship** and **general notes** | **G** the user is on the People screen · **W** they submit the new-person form with a non-empty name · **T** the person is saved and appears in the list; an empty name is rejected with an inline error and nothing is saved |
| **FR-02** | MUST | View all people in a list showing name, relationship, and observation count | **G** ≥1 person exists · **W** the People screen loads · **T** each person shows name, relationship (or "—"), and an accurate count of their observations |
| **FR-03** | MUST | Edit a person's name, relationship, and notes | **W** the user edits and saves a person · **T** changes persist and are reflected immediately; an empty name is rejected |
| **FR-04** | MUST | Delete a person, with confirmation | **W** the user confirms deletion · **T** the person and **all their observations + evidence** are removed (no orphans); cancelling makes no change |
| **FR-05** | SHOULD | Archive/unarchive a person (action available from the person's detail page; no confirmation required since it is non-destructive) | **W** the user archives a person · **T** they are hidden from the default People list and default search/filter results, but retained and restorable via a "Show archived" toggle. The observation **count shown for a person always reflects that person's own observations**, independent of archive state (v1 has no cross-person aggregate views, so archiving affects only list visibility) |
| **FR-06** | MUST | Search people by name and filter by relationship | **W** the user types a query / picks a relationship filter · **T** the list shows only matching, non-archived people; clearing restores the full list |

### 2.2 Observations (US-02)

| ID | Pri | Requirement | Acceptance criteria |
|---|---|---|---|
| **FR-07** | MUST | Add an observation to a person: required **text**, optional **occurred-on date** (defaults to today) | **W** the user submits an observation with non-empty text · **T** it is saved against that person and shown in their timeline; empty text is rejected |
| **FR-08** | MUST | View a person's observations as a timeline, newest first by occurred-on date | **G** a person has ≥2 observations on different dates · **T** they render in descending occurred-on order |
| **FR-09** | MUST | Edit an observation's text, date, and evidence | **W** the user edits and saves · **T** changes persist and the profile recomputes |
| **FR-10** | MUST | Delete an observation, with confirmation | **W** confirmed · **T** the observation and its evidence are removed and the profile recomputes |

### 2.3 Trait evidence & tagging (US-03)

| ID | Pri | Requirement | Acceptance criteria |
|---|---|---|---|
| **FR-11** | MUST | Attach **Big Five evidence** to an observation: pick a dimension (O/C/E/A/N), a **direction** (high `+1` / low `-1`), and a **weight** (1–3) | **W** the user adds Big Five evidence and saves · **T** it is stored against the observation and contributes to that dimension's score |
| **FR-12** | MUST | Attach **MBTI evidence** to an observation: pick an axis (E/I, S/N, T/F, J/P), a **pole**, and a **weight** (1–3) | **W** the user adds MBTI evidence and saves · **T** it is stored and contributes to that axis's tally |
| **FR-13** | MUST | An observation may have **zero or many** evidence items across both frameworks | **T** an observation with no evidence is valid (pure note); one with multiple dimensions/axes is valid |
| **FR-14** | SHOULD | Remove an individual evidence item from an observation | **W** the user removes one evidence item and saves · **T** only that item is gone; the profile recomputes |
| **FR-15** | SHOULD | Each framework option is labelled in plain language using the **canonical label table in `02 §11`** | **T** every dimension (both poles), axis (both poles), and weight shows the exact human-readable label/hint from `02 §11` in the picker |

### 2.4 Profile computation & display (US-04, US-05)

| ID | Pri | Requirement | Acceptance criteria |
|---|---|---|---|
| **FR-16** | MUST | Compute each **Big Five dimension score** deterministically from evidence per the algorithm in `02-technical-design.md §5.1` | **G** known evidence · **T** the score equals the spec's formula output exactly; identical input always yields identical output |
| **FR-17** | MUST | Display Big Five as five **0–100 scores** in a **horizontal bar chart** (`D-11`), 50 = neutral, **with an equivalent text/table view** for accessibility | **T** all five dimensions render as bars; a dimension with **no evidence** shows "insufficient data", **not** 50; the table alternative lists the same scores (`NFR-07`) |
| **FR-18** | MUST | Compute the **MBTI type** deterministically per `02-technical-design.md §5.2` (per-axis weighted tally → letter) | **G** known evidence · **T** the four letters match the spec; ties on an axis render that letter as `?` and the type is flagged "incomplete" |
| **FR-19** | MUST | Display the MBTI type (e.g. `INTJ`) as a **text + per-axis table** (winning pole, tally split, confidence %); no chart in v1 (`D-13`). Being text/table, it is inherently the accessible view | **T** each axis shows winning pole, tally split, and confidence as an integer % (`02 §5.2`); an axis with no evidence shows "no data"; a tied/undetermined axis shows `?` |
| **FR-20** | MUST | Show **why**: each dimension/axis links to the observations whose evidence drove it | **W** the user expands a dimension/axis · **T** the contributing observations (with evidence direction/pole and weight) are listed; expanding a dimension/axis with **no evidence** shows "No observations tagged for this yet" (the expand control is still present) |
| **FR-21** | SHOULD | Show an **evidence-strength indicator** per dimension/axis (e.g. number of contributing observations / total weight) | **T** dimensions backed by more evidence are visibly distinguished from thinly-supported ones |

### 2.5 Data portability (US-07)

| ID | Pri | Requirement | Acceptance criteria |
|---|---|---|---|
| **FR-22** | MUST | Export all data (people, observations, evidence) to a single downloadable **JSON** file with a schema version | **W** the user exports · **T** a valid JSON file downloads containing every record and a `schemaVersion` field (payload shape per `02 §10.1`) |
| **FR-23** | MUST | Import a JSON file in **Replace** mode: wipe existing data and load the file verbatim, after whole-payload validation | **W** the user imports a valid file in Replace mode · **T** local data becomes byte-identical to the file (ids + timestamps preserved); an invalid/corrupt file is rejected with a clear error and **no partial state** is written (`02 §10.2–10.3`) |
| **FR-24** | SHOULD | Clear all local data, with a strong confirmation | **W** the user confirms "clear all" · **T** all records are deleted and the app returns to an empty state |
| **FR-25** | SHOULD | Import a JSON file in **Merge** mode: deterministic **upsert by id** (imported wins on id conflict, timestamps preserved), after whole-payload validation | **W** the user imports in Merge mode · **T** same-id rows are overwritten and new-id rows inserted per `02 §10.4`; a payload that would dangle a reference is rejected with no partial write |

## 3. Non-functional requirements

| ID | Category | Requirement | Acceptance criteria |
|---|---|---|---|
| **NFR-01** | Persistence | Data survives reloads and browser restarts via IndexedDB (`A-02`) | **W** the user adds data, closes the tab, and reopens the app · **T** all data is present |
| **NFR-02** | Privacy | No data leaves the device except via explicit user-initiated export; no telemetry/third-party calls (`A-09`) | **T** a network inspection during normal use shows no outbound data requests; only static assets load |
| **NFR-03** | Offline | Core flows (add/edit people, observations, view profiles) work with no network | **W** the network is disabled · **T** all core flows still function |
| **NFR-04** | Performance | With `A-06` scale (500 people / 10k observations), the People list and a Person profile each render in **< 500 ms** on a mid-range laptop | **T** a seeded large dataset meets the budget (measured in the perf test) |
| **NFR-05** | Determinism | Profile computation is a **pure function** of evidence — no time, randomness, or hidden state | **T** the same evidence yields byte-identical computed profiles across runs/machines (`D-08`) |
| **NFR-06** | Data integrity | Deleting a person/observation never leaves orphaned children; all writes are validated against a schema (Zod) before persisting | **T** after any delete, no evidence/observation references a missing parent (integrity test) |
| **NFR-07** | Accessibility | Keyboard-operable forms and navigation; form fields have labels; charts have a text/table alternative | **T** all core flows are completable using only the keyboard; automated a11y check (axe) reports no critical violations |
| **NFR-08** | Responsiveness | Usable layout from 1024 px down to 768 px (`A-05`) | **T** no horizontal scroll or overlapping controls across that range on key screens |
| **NFR-09** | Maintainability | Domain logic is UI-independent and has the highest test coverage (`D-08`); see coverage targets in `04-test-strategy.md` | **T** the domain module imports no React/DOM code |
| **NFR-10** | Browser support | Works on the browsers in `A-04` | **T** the e2e suite passes on at least one Chromium and one WebKit/Firefox target |

## 4. Constraints

- **C-01** No backend/server in v1 (`A-02`); everything runs client-side.
- **C-02** No AI/LLM dependency (`D-03`); all categorization is user-driven and deterministic.
- **C-03** No user accounts/auth (`A-01`).

## 5. Acceptance of this document

These requirements are considered ready when every `FR-`/`NFR-` above has at least one task
(`03-tasks.md`) and at least one test case (`04-test-strategy.md`) referencing it — proven by
the matrix in `05-traceability-matrix.md`.
