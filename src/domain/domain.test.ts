import { describe, it, expect } from 'vitest'
import { PersonSchema, ObservationSchema, EvidenceSchema } from './schema'

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
