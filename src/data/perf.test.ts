import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'
import { loadSeed, generateSeed } from './seed'
import { listPeople } from './people.repo'
import { listEvidenceForPerson } from './evidence.repo'
import { computeProfile } from '../domain/profile'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

// TC-N-03 — render-budget proxy at A-06 scale (500 people / 10k observations).
// Note: fake-indexeddb in Node is slower than a browser's native IndexedDB, so
// these budgets are deliberately generous for the data layer; the pure compute
// (which actually gates the profile render) is held to a tight bound.
describe('TC-N-03 — performance at A-06 scale', () => {
  it('generates the full scale dataset deterministically', () => {
    const a = generateSeed()
    const b = generateSeed()
    expect(a.people.length).toBe(500)
    expect(a.observations.length).toBe(10000)
    // deterministic: two generations are identical
    expect(JSON.stringify(a.evidence[0])).toBe(JSON.stringify(b.evidence[0]))
  })

  it('listPeople over 500 people / 10k observations stays within budget', async () => {
    await loadSeed()
    const start = performance.now()
    const people = await listPeople()
    const elapsed = performance.now() - start
    expect(people.length).toBeGreaterThan(0)
    // Generous data-layer bound for fake-indexeddb; browser is far faster.
    expect(elapsed).toBeLessThan(3000)
  })

  it('computeProfile for one person is well under the 500 ms render budget', async () => {
    await loadSeed()
    const someone = (await db.people.toArray())[0]
    const evidence = await listEvidenceForPerson(someone.id)
    const start = performance.now()
    computeProfile(someone.id, evidence)
    const elapsed = performance.now() - start
    // Pure compute that gates the profile render — must be tiny.
    expect(elapsed).toBeLessThan(50)
  })
})
