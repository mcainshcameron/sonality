import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'
import { createPerson } from './people.repo'
import { createObservation } from './observations.repo'
import { addEvidence } from './evidence.repo'
import {
  exportToJson,
  importReplace,
  importMerge,
  clearAll,
  ImportError,
} from './portability'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

async function seed() {
  const p = await createPerson({ name: 'Alice', relationship: 'friend' })
  const o = await createObservation({ personId: p.id, text: 'organized', occurredOn: '2026-06-10' })
  await addEvidence({ observationId: o.id, framework: 'BIG_FIVE', dimension: 'C', direction: 1, weight: 3 })
  return { p, o }
}

// TC-R-07
describe('TC-R-07 — export → clear → Replace-import round-trips byte-identically', () => {
  it('restores an identical dataset (ids + timestamps preserved)', async () => {
    await seed()
    const exported = await exportToJson('2026-06-21T00:00:00.000Z')

    await clearAll()
    expect(await db.people.count()).toBe(0)

    await importReplace(exported)

    const reExported = await exportToJson('2026-06-21T00:00:00.000Z')
    expect(reExported).toBe(exported)
  })
})

// TC-R-08
describe('TC-R-08 — corrupt/invalid import is rejected with no partial write', () => {
  it('rejects non-JSON', async () => {
    await seed()
    const before = await db.people.count()
    await expect(importReplace('not json{')).rejects.toThrow(ImportError)
    expect(await db.people.count()).toBe(before)
  })

  it('rejects wrong schemaVersion', async () => {
    const bad = JSON.stringify({ schemaVersion: 2, exportedAt: '2026-06-21T00:00:00.000Z', people: [], observations: [], evidence: [] })
    await expect(importReplace(bad)).rejects.toThrow(ImportError)
  })

  it('rejects a schema violation and writes nothing', async () => {
    await seed()
    const before = await db.people.count()
    const bad = JSON.stringify({
      schemaVersion: 1,
      exportedAt: '2026-06-21T00:00:00.000Z',
      people: [{ id: 'not-a-uuid', name: '', archived: false, createdAt: 'x', updatedAt: 'y' }],
      observations: [],
      evidence: [],
    })
    await expect(importReplace(bad)).rejects.toThrow(ImportError)
    expect(await db.people.count()).toBe(before)
  })

  it('rejects a dangling reference (observation with missing person)', async () => {
    const bad = JSON.stringify({
      schemaVersion: 1,
      exportedAt: '2026-06-21T00:00:00.000Z',
      people: [],
      observations: [
        {
          id: '00000000-0000-0000-0000-000000000001',
          personId: '00000000-0000-0000-0000-0000000000ff',
          text: 'orphan',
          occurredOn: '2026-06-10',
          createdAt: '2026-06-10T00:00:00.000Z',
          updatedAt: '2026-06-10T00:00:00.000Z',
        },
      ],
      evidence: [],
    })
    await expect(importReplace(bad)).rejects.toThrow(ImportError)
  })
})

// TC-R-09
describe('TC-R-09 — clear-all empties every store', () => {
  it('removes people, observations, and evidence', async () => {
    await seed()
    await clearAll()
    expect(await db.people.count()).toBe(0)
    expect(await db.observations.count()).toBe(0)
    expect(await db.evidence.count()).toBe(0)
  })
})

// TC-R-10
describe('TC-R-10 — Merge-import upserts by id', () => {
  it('overwrites same-id row (imported wins) and inserts new-id row', async () => {
    // Local: Alice (p1)
    const p1 = await createPerson({ name: 'Alice' })

    // Import file: p1 renamed to Alicia + new p2 Bob (with valid timestamps)
    const now = '2026-06-21T00:00:00.000Z'
    const p2id = '00000000-0000-0000-0000-0000000000b0'
    const payload = JSON.stringify({
      schemaVersion: 1,
      exportedAt: now,
      people: [
        { id: p1.id, name: 'Alicia', archived: false, createdAt: p1.createdAt, updatedAt: now },
        { id: p2id, name: 'Bob', archived: false, createdAt: now, updatedAt: now },
      ],
      observations: [],
      evidence: [],
    })

    await importMerge(payload)

    expect(await db.people.count()).toBe(2)
    expect((await db.people.get(p1.id))?.name).toBe('Alicia')
    expect((await db.people.get(p2id))?.name).toBe('Bob')
  })

  it('export → clear → merge-import restores the original state', async () => {
    await seed()
    const exported = await exportToJson('2026-06-21T00:00:00.000Z')
    await clearAll()
    await importMerge(exported)
    expect(await exportToJson('2026-06-21T00:00:00.000Z')).toBe(exported)
  })
})

// TC-R-11
describe('TC-R-11 — Merge-import with dangling reference is rejected, no partial write', () => {
  it('rejects an imported observation whose person is absent locally and in file', async () => {
    await createPerson({ name: 'Existing' })
    const before = await db.observations.count()
    const bad = JSON.stringify({
      schemaVersion: 1,
      exportedAt: '2026-06-21T00:00:00.000Z',
      people: [],
      observations: [
        {
          id: '00000000-0000-0000-0000-000000000001',
          personId: '00000000-0000-0000-0000-0000000000ee',
          text: 'orphan',
          occurredOn: '2026-06-10',
          createdAt: '2026-06-10T00:00:00.000Z',
          updatedAt: '2026-06-10T00:00:00.000Z',
        },
      ],
      evidence: [],
    })
    await expect(importMerge(bad)).rejects.toThrow(ImportError)
    expect(await db.observations.count()).toBe(before)
  })
})
