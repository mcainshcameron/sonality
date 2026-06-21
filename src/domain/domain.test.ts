import { describe, it, expect } from 'vitest'
import { PersonSchema, ObservationSchema, EvidenceSchema } from './schema'
import { computeProfile } from './profile'
import type { Evidence, BigFiveDimension, MbtiAxis, MbtiPole, Direction, Weight } from './types'

const ID1 = '00000000-0000-0000-0000-000000000001'
const ID2 = '00000000-0000-0000-0000-000000000002'
const NOW = '2026-06-21T00:00:00.000Z'
const DATE = '2026-06-21'

const baseEvidence = { id: ID1, observationId: ID2 }
const basePerson = { id: ID1, archived: false, createdAt: NOW, updatedAt: NOW }
const baseObs = { id: ID1, personId: ID2, occurredOn: DATE, createdAt: NOW, updatedAt: NOW }

// TC-D-01
describe('TC-D-01 — valid Big Five evidence is accepted', () => {
  it('accepts BIG_FIVE {dimension:O, direction:+1, weight:2}', () => {
    const r = EvidenceSchema.safeParse({
      ...baseEvidence,
      framework: 'BIG_FIVE',
      dimension: 'O',
      direction: 1,
      weight: 2,
    })
    expect(r.success).toBe(true)
  })
})

// TC-D-02
describe('TC-D-02 — valid MBTI evidence is accepted', () => {
  it('accepts MBTI {axis:EI, pole:I, weight:3}', () => {
    const r = EvidenceSchema.safeParse({
      ...baseEvidence,
      framework: 'MBTI',
      axis: 'EI',
      pole: 'I',
      weight: 3,
    })
    expect(r.success).toBe(true)
  })
})

// TC-D-03
describe('TC-D-03 — pole not on axis is rejected', () => {
  it('rejects MBTI axis:EI with pole:S', () => {
    const r = EvidenceSchema.safeParse({
      ...baseEvidence,
      framework: 'MBTI',
      axis: 'EI',
      pole: 'S',
      weight: 1,
    })
    expect(r.success).toBe(false)
  })
})

// TC-D-04
describe('TC-D-04 — BIG_FIVE with axis field is rejected', () => {
  it('rejects BIG_FIVE evidence carrying an axis', () => {
    const r = EvidenceSchema.safeParse({
      ...baseEvidence,
      framework: 'BIG_FIVE',
      dimension: 'C',
      direction: -1,
      weight: 2,
      axis: 'EI',
    })
    expect(r.success).toBe(false)
  })
})

// TC-D-05
describe('TC-D-05 — invalid weight is rejected', () => {
  it('rejects weight:4', () => {
    const r = EvidenceSchema.safeParse({
      ...baseEvidence,
      framework: 'BIG_FIVE',
      dimension: 'O',
      direction: 1,
      weight: 4,
    })
    expect(r.success).toBe(false)
  })

  it('rejects weight:0', () => {
    const r = EvidenceSchema.safeParse({
      ...baseEvidence,
      framework: 'BIG_FIVE',
      dimension: 'O',
      direction: 1,
      weight: 0,
    })
    expect(r.success).toBe(false)
  })
})

// TC-D-06
describe('TC-D-06 — empty or whitespace-only name is rejected', () => {
  it('rejects empty name', () => {
    expect(PersonSchema.safeParse({ ...basePerson, name: '' }).success).toBe(false)
  })

  it('rejects whitespace-only name', () => {
    expect(PersonSchema.safeParse({ ...basePerson, name: '   ' }).success).toBe(false)
  })

  it('accepts a valid trimmed name', () => {
    expect(PersonSchema.safeParse({ ...basePerson, name: 'Alice' }).success).toBe(true)
  })
})

// TC-D-07
describe('TC-D-07 — observation text over 5000 chars is rejected', () => {
  it('rejects text of 5001 characters', () => {
    const r = ObservationSchema.safeParse({
      ...baseObs,
      text: 'a'.repeat(5001),
    })
    expect(r.success).toBe(false)
  })

  it('accepts text of exactly 5000 characters', () => {
    const r = ObservationSchema.safeParse({
      ...baseObs,
      text: 'a'.repeat(5000),
    })
    expect(r.success).toBe(true)
  })
})

// ─── TC-P-* profile algorithm tests (02 §5) ──────────────────────────────────

const PID = 'person-1'

function bf(i: number, dim: BigFiveDimension, dir: Direction, w: Weight): Evidence {
  return { id: `e${i}`, observationId: `o${i}`, framework: 'BIG_FIVE', dimension: dim, direction: dir, weight: w }
}

function mb(i: number, axis: MbtiAxis, pole: MbtiPole, w: Weight): Evidence {
  return { id: `e${i}`, observationId: `o${i}`, framework: 'MBTI', axis, pole, weight: w }
}

// TC-P-01
describe('TC-P-01 — Big Five worked example: E (+1,3),(+1,1),(-1,2) → 67', () => {
  it('score=67 count=3 weight=6', () => {
    const ev = [bf(1, 'E', 1, 3), bf(2, 'E', 1, 1), bf(3, 'E', -1, 2)]
    const dim = computeProfile(PID, ev).bigFive.find((d) => d.dimension === 'E')!
    expect(dim.score).toBe(67)
    expect(dim.evidenceCount).toBe(3)
    expect(dim.totalWeight).toBe(6)
  })
})

// TC-P-02
describe('TC-P-02 — dimension with no evidence → score null, NOT 50', () => {
  it('score is null', () => {
    const dim = computeProfile(PID, []).bigFive.find((d) => d.dimension === 'O')!
    expect(dim.score).toBeNull()
    expect(dim.evidenceCount).toBe(0)
  })
})

// TC-P-03
describe('TC-P-03 — all +1 evidence → score 100', () => {
  it('score=100', () => {
    const ev = [bf(1, 'C', 1, 3), bf(2, 'C', 1, 2)]
    const dim = computeProfile(PID, ev).bigFive.find((d) => d.dimension === 'C')!
    expect(dim.score).toBe(100)
  })
})

// TC-P-04
describe('TC-P-04 — balanced evidence → score 50', () => {
  it('score=50', () => {
    const ev = [bf(1, 'A', 1, 2), bf(2, 'A', -1, 2)]
    const dim = computeProfile(PID, ev).bigFive.find((d) => d.dimension === 'A')!
    expect(dim.score).toBe(50)
  })
})

// TC-P-05
describe('TC-P-05 — MBTI EI: E(2),I(1) → winner E, confidence 1/3, decided', () => {
  it('correct axis result', () => {
    const ev = [mb(1, 'EI', 'E', 2), mb(2, 'EI', 'I', 1)]
    const axis = computeProfile(PID, ev).mbti.axes.find((a) => a.axis === 'EI')!
    expect(axis.status).toBe('decided')
    expect(axis.winner).toBe('E')
    expect(axis.confidence).toBeCloseTo(1 / 3, 10)
  })
})

// TC-P-06
describe('TC-P-06 — MBTI tie T(2),F(2) → tie, winner null, complete=false', () => {
  it('tie status', () => {
    const ev = [mb(1, 'TF', 'T', 2), mb(2, 'TF', 'F', 2)]
    const profile = computeProfile(PID, ev)
    const axis = profile.mbti.axes.find((a) => a.axis === 'TF')!
    expect(axis.status).toBe('tie')
    expect(axis.winner).toBeNull()
    expect(axis.confidence).toBe(0)
    expect(profile.mbti.complete).toBe(false)
    expect(profile.mbti.type).toContain('?')
  })
})

// TC-P-07
describe('TC-P-07 — MBTI axis with no evidence → no-data, letter ?', () => {
  it('no-data status', () => {
    const axis = computeProfile(PID, []).mbti.axes.find((a) => a.axis === 'SN')!
    expect(axis.status).toBe('no-data')
    expect(axis.winner).toBeNull()
    expect(axis.confidence).toBeNull()
  })
})

// TC-P-08
describe('TC-P-08 — §5.2 worked example → type EN?J, complete=false', () => {
  it('type=EN?J', () => {
    // EI→ E(2),I(1);  SN→ N(3);  TF→ none;  JP→ J(1)+J(2)
    const ev = [
      mb(1, 'EI', 'E', 2), mb(2, 'EI', 'I', 1),
      mb(3, 'SN', 'N', 3),
      mb(4, 'JP', 'J', 1), mb(5, 'JP', 'J', 2),
    ]
    const mbti = computeProfile(PID, ev).mbti
    expect(mbti.type).toBe('EN?J')
    expect(mbti.complete).toBe(false)
  })
})

// TC-P-09
describe('TC-P-09 — order independence', () => {
  it('shuffled input produces identical Profile', () => {
    const ev = [bf(1, 'E', 1, 3), bf(2, 'E', 1, 1), bf(3, 'E', -1, 2)]
    const p1 = computeProfile(PID, ev)
    const p2 = computeProfile(PID, [...ev].reverse())
    expect(JSON.stringify(p1)).toBe(JSON.stringify(p2))
  })
})

// TC-P-10
describe('TC-P-10 — determinism: two calls with same input are byte-identical', () => {
  it('no clock or RNG dependency', () => {
    const ev = [bf(1, 'O', 1, 2), mb(2, 'EI', 'E', 1)]
    const p1 = computeProfile(PID, ev)
    const p2 = computeProfile(PID, ev)
    expect(JSON.stringify(p1)).toBe(JSON.stringify(p2))
  })
})

// TC-P-11
describe('TC-P-11 — single-pole MBTI E(3) → decided, confidence 1.0 (§5.2 edge case)', () => {
  it('confidence=1.0 even with only one pole present', () => {
    const ev = [mb(1, 'EI', 'E', 3)]
    const axis = computeProfile(PID, ev).mbti.axes.find((a) => a.axis === 'EI')!
    expect(axis.status).toBe('decided')
    expect(axis.winner).toBe('E')
    expect(axis.confidence).toBe(1.0)
  })
})

// TC-P-12
describe('TC-P-12 — all -1 evidence → score 0 (lower bound)', () => {
  it('score=0', () => {
    const ev = [bf(1, 'N', -1, 2), bf(2, 'N', -1, 1)]
    const dim = computeProfile(PID, ev).bigFive.find((d) => d.dimension === 'N')!
    expect(dim.score).toBe(0)
  })
})
