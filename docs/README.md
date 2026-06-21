# Sonality — Implementation Documents

Read in order. Everything traces back to the decisions/assumptions in doc `00`.

| # | Document | Read it to learn… |
|---|---|---|
| 00 | [Overview & Decisions](./00-overview-and-decisions.md) | the vision, locked decisions, assumptions, glossary |
| 01 | [Requirements](./01-requirements.md) | what to build (`FR-`/`NFR-`) with acceptance criteria |
| 02 | [Technical Design](./02-technical-design.md) | architecture, data model, the exact profile algorithm |
| 03 | [Tasks](./03-tasks.md) | the work breakdown + Definition of Done |
| 04 | [Test Strategy](./04-test-strategy.md) | how every requirement is verified (`TC-`) |
| 05 | [Traceability Matrix](./05-traceability-matrix.md) | proof every requirement is built and tested |

**Status:** Pre-implementation. Foundational product decisions confirmed by the user
(observe-&-profile-others · Big Five + MBTI · manual tagging, no AI · web app). One open
assumption flagged for the user: local-first storage with manual JSON backup (`00 §4`, A-02/A-03).

**Source brief:** [`../Description.md`](../Description.md)
