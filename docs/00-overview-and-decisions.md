# Sonality — Overview, Decisions & Assumptions

> Anchor document. Every other artifact (requirements, design, tasks, tests) traces
> back to the decisions (`D-##`) and assumptions (`A-##`) recorded here. If a decision
> here changes, search the docs for its ID to find everything affected.

## 1. Vision

**Sonality** is a personal web app that helps one user understand the people in their life
by recording observations of behaviour and categorizing that behaviour against
well-understood personality frameworks. It is an *observer's notebook*, not a
self-assessment quiz: the user is the analyst, the people they know are the subjects.

Source brief (`Description.md`):
> "I love understanding peoples personality traits and categorizing and matching their
> behaviour to well understood traits. I want an app to help me do this."

## 2. What v1 is and is not

| In scope (v1) | Out of scope (v1) |
|---|---|
| Record people the user knows | Multi-user accounts / sharing |
| Log dated behaviour observations per person | AI/LLM-suggested trait inference |
| Tag observations with trait *evidence* (Big Five + MBTI) | Cloud sync / multi-device |
| Compute a deterministic profile from evidence | Compatibility scoring between people |
| Visualize Big Five (dimensions) + MBTI (type) | Mobile-native apps |
| Search/filter/archive people | Aggregate/group analytics |
| Export & import data as JSON (backup/portability) | Real-time collaboration |

Out-of-scope items are deferred, not rejected — see `D-09`.

## 3. Decisions (locked by the user unless noted)

| ID | Decision | Source |
|---|---|---|
| **D-01** | Product model = **observe & profile others** (personal analyst tool) | User |
| **D-02** | Frameworks = **Big Five (OCEAN)** and **MBTI (16 types)**, both shown per person | User |
| **D-03** | Categorization method = **manual tagging** — user assigns trait evidence; **no AI/LLM** | User |
| **D-04** | Platform = **web app** (runs in an evergreen desktop browser) | User |
| **D-05** | Profiles are **computed deterministically** from the evidence the user tags (see `02-technical-design.md §5`) | Derived from D-03 |
| **D-06** | A person's profile shows **both** a Big Five dimensional view **and** an MBTI type view, side by side | Derived from D-02 |
| **D-07** | Tech stack = **React + TypeScript + Vite**, **Dexie/IndexedDB** persistence, **Recharts** viz, **Vitest/Playwright** tests | Proposed (see A-07) |
| **D-08** | Domain logic (profile computation, validation) lives in a **pure, UI-independent layer** so it is unit-testable in isolation | Quality |
| **D-09** | Deferred features (sync, AI, compatibility) are kept out of v1 but the data model must not block them | Scope |
| **D-10** | Import has two modes: **Replace** (v1 MUST) and **Merge by id** (SHOULD). Merge is a deterministic upsert by `id`, imported-wins on conflict, timestamps preserved (`02 §10`) | Resolves the largest review gap |
| **D-11** | Big Five chart = **horizontal bars** in v1 (radar deferred) | Resolves TQ-01 |
| **D-12** | `occurredOn` default = the user's **local calendar date**; any valid date accepted; date-only | Removes timezone ambiguity |
| **D-13** | MBTI is rendered as **text + a per-axis table** (no chart in v1); the table is itself the accessible view | Resolves FR-17/19 parity |
| **D-14** | `confidence` stored as float `[0,1]`, **displayed as an integer %**; reflects evidence *consistency*, not sample size (strength shown separately, `FR-21`) | Removes precision/edge-case ambiguity |

## 4. Assumptions (defaults chosen to avoid blocking; user may overturn any)

| ID | Assumption | Rationale | Risk if wrong |
|---|---|---|---|
| **A-01** | **Single user**, no authentication/login in v1 | Personal tool; the device is the trust boundary | Low — auth can be added without reshaping the domain model |
| **A-02** | **Local-first**: data persists in the browser (IndexedDB); **no backend server, no cloud** in v1 | Maximum privacy for sensitive notes about real people; zero hosting cost; fastest path | Medium — no multi-device sync until added; mitigated by JSON export/import |
| **A-03** | **JSON export/import** is the v1 backup & portability mechanism (no automatic backup) | Local-first has no server to back up to | Medium — user must export manually; documented in UI |
| **A-04** | Target browsers = **current Chrome, Edge, Firefox, Safari** (evergreen, last 2 versions) | IndexedDB + modern JS available everywhere needed | Low |
| **A-05** | **Desktop-first responsive** layout; usable but not optimized on tablet; phone is best-effort | Primary use is reflective analysis at a desk | Low |
| **A-06** | Scale target: **≤ 500 people** and **≤ 10,000 observations** total perform smoothly | Personal use, not a CRM | Low — IndexedDB handles far more |
| **A-07** | The specific libraries in **D-07** are the recommended stack; any could be swapped for an equivalent without changing requirements | Implementation detail, not a product decision | Low |
| **A-08** | MBTI is presented as a **descriptive/illustrative** typology, not a clinical claim; Big Five is the primary, evidence-weighted view | Scientific honesty; avoids over-claiming | Low |
| **A-09** | No analytics, telemetry, or third-party tracking ship in v1 | Privacy-by-default | Low |

**Open question flagged for the user (non-blocking):** `A-02`/`A-03` assume local-first with
manual JSON backup. If the user wants multi-device access or automatic backup, that becomes a
product fork (adds a backend + auth). Proceeding local-first until told otherwise.

## 5. Glossary

| Term | Definition |
|---|---|
| **Person / Subject** | An individual the user is profiling. The user themself is not a subject in v1. |
| **Observation** | A dated, free-text note describing a specific observed behaviour of one person. |
| **Trait evidence** | A structured tag the user attaches to an observation, asserting that the behaviour is a signal for a specific Big Five dimension (with direction) or MBTI axis pole, at a chosen weight. |
| **Profile** | The computed summary of a person: Big Five dimension scores + MBTI type, derived purely from that person's trait evidence. Never stored; always recomputed. |
| **Big Five / OCEAN** | Five dimensions: **O**penness, **C**onscientiousness, **E**xtraversion, **A**greeableness, **N**euroticism. Each scored 0–100 (50 = neutral / balanced evidence). |
| **MBTI** | Four dichotomous axes — **E/I**, **S/N**, **T/F**, **J/P** — combining into one of 16 four-letter types (e.g. `INTJ`). |
| **Direction** | For Big Five evidence: `+1` (signals the high pole of the dimension) or `-1` (low pole). |
| **Pole** | For MBTI evidence: which side of the axis the behaviour signals (e.g. `E` vs `I`). |
| **Weight** | Strength of an evidence item: `1` (weak), `2` (moderate), `3` (strong). |
| **Definition of Done (DoD)** | The release-gate checklist in `03-tasks.md §4`. |

## 6. Document map

| File | Purpose |
|---|---|
| `00-overview-and-decisions.md` | This file — vision, decisions, assumptions, glossary |
| `01-requirements.md` | User stories, functional (`FR-`) & non-functional (`NFR-`) requirements with acceptance criteria |
| `02-technical-design.md` | Architecture, data model, profile-computation spec, components, dependencies |
| `03-tasks.md` | Work breakdown (`T-`) with per-task acceptance criteria + the Definition of Done |
| `04-test-strategy.md` | Test levels, concrete test cases (`TC-`), coverage targets, fixtures |
| `05-traceability-matrix.md` | `FR/NFR → T → TC` matrix proving every requirement is built and tested |

## 7. Decision & change log

| Date | Change | By |
|---|---|---|
| 2026-06-21 | Initial decisions D-01…D-09 and assumptions A-01…A-09 recorded; document suite created | Implementation-prep loop, round 1 |
| 2026-06-21 | Two independent reviewers ran; both flagged import-merge semantics as the #1 gap. Added D-10…D-14; fully specified merge (`02 §10`) + canonical labels (`02 §11`); clarified confidence edge case, `occurredOn`, archive↔counts, memoization; added FR-25 and tests TC-P-11/12, TC-R-10/11, TC-U-07/08 | Implementation-prep loop, round 2 |
| 2026-06-21 | v1 implemented T-01…T-16. All MUST + SHOULD requirements built; 84 unit/component tests + 26 e2e tests (Chromium + Firefox) green; domain coverage 100% lines (gate ≥95%); a11y (axe) and perf (A-06 scale) verified. No decisions changed during build — implementation matched the spec as written | Implementation loop |
