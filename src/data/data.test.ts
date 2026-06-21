import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'
import { createPerson, getPerson, updatePerson, deletePerson, listPeople, archivePerson } from './people.repo'
import {
  createObservation,
  getObservation,
  updateObservation,
  deleteObservation,
  listObservationsByPerson,
} from './observations.repo'
import { addEvidence, removeEvidence, listEvidenceForObservation } from './evidence.repo'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

// TC-R-01
describe('TC-R-01 — create/read/update person persists', () => {
  it('persists name across read, update, and re-read', async () => {
    const p = await createPerson({ name: 'Alice' })
    expect(p.name).toBe('Alice')
    expect(p.archived).toBe(false)
    expect(p.id).toBeTruthy()

    const fetched = await getPerson(p.id)
    expect(fetched?.name).toBe('Alice')

    const updated = await updatePerson(p.id, { name: 'Alice B.' })
    expect(updated.name).toBe('Alice B.')

    const refetched = await getPerson(p.id)
    expect(refetched?.name).toBe('Alice B.')
  })

  it('rejects empty name at create time', async () => {
    await expect(createPerson({ name: '' })).rejects.toThrow()
  })

  it('listPeople returns observation count of zero for new person', async () => {
    await createPerson({ name: 'Bob' })
    const list = await listPeople()
    expect(list[0].observationCount).toBe(0)
  })
})

// TC-R-02
describe('TC-R-02 — delete person cascades to observations and evidence', () => {
  it('removing a person deletes their observations and evidence', async () => {
    const p = await createPerson({ name: 'Charlie' })
    const now = new Date().toISOString()

    await db.observations.add({
      id: 'obs-1',
      personId: p.id,
      text: 'test observation',
      occurredOn: '2026-06-21',
      createdAt: now,
      updatedAt: now,
    })
    await db.evidence.add({
      id: 'ev-1',
      observationId: 'obs-1',
      framework: 'BIG_FIVE',
      dimension: 'O',
      direction: 1,
      weight: 2,
    })

    await deletePerson(p.id)

    expect(await getPerson(p.id)).toBeUndefined()
    expect(await db.observations.where('personId').equals(p.id).count()).toBe(0)
    expect(await db.evidence.where('observationId').equals('obs-1').count()).toBe(0)
  })

  it('orphan invariant: no observation references a deleted person', async () => {
    const p = await createPerson({ name: 'Dana' })
    const now = new Date().toISOString()
    await db.observations.add({
      id: 'obs-2',
      personId: p.id,
      text: 'note',
      occurredOn: '2026-06-21',
      createdAt: now,
      updatedAt: now,
    })

    await deletePerson(p.id)

    const orphans = await db.observations.where('personId').equals(p.id).count()
    expect(orphans).toBe(0)
  })
})

// TC-R-03
describe('TC-R-03 — search and relationship filter', () => {
  it('search by name (case-insensitive) narrows the list', async () => {
    await createPerson({ name: 'Alice', relationship: 'friend' })
    await createPerson({ name: 'Bob', relationship: 'colleague' })

    const results = await listPeople({ search: 'ali' })
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Alice')
  })

  it('relationship filter returns only matching people', async () => {
    await createPerson({ name: 'Alice', relationship: 'friend' })
    await createPerson({ name: 'Bob', relationship: 'colleague' })

    const results = await listPeople({ relationship: 'friend' })
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Alice')
  })

  it('empty search returns all non-archived people', async () => {
    await createPerson({ name: 'Alice' })
    await createPerson({ name: 'Bob' })
    const results = await listPeople({ search: '' })
    expect(results).toHaveLength(2)
  })
})

// TC-R-04
describe('TC-R-04 — archive and restore', () => {
  it('archived person is excluded from the default list', async () => {
    const p = await createPerson({ name: 'Eve' })
    await archivePerson(p.id, true)

    const defaultList = await listPeople()
    expect(defaultList.find((x) => x.id === p.id)).toBeUndefined()
  })

  it('archived person appears when includeArchived is true', async () => {
    const p = await createPerson({ name: 'Eve' })
    await archivePerson(p.id, true)

    const withArchived = await listPeople({ includeArchived: true })
    expect(withArchived.find((x) => x.id === p.id)).toBeDefined()
  })

  it('restored person reappears in the default list', async () => {
    const p = await createPerson({ name: 'Frank' })
    await archivePerson(p.id, true)
    await archivePerson(p.id, false)

    const list = await listPeople()
    expect(list.find((x) => x.id === p.id)).toBeDefined()
  })
})

// TC-R-05
describe('TC-R-05 — observation CRUD and timeline order', () => {
  it('creates observation with explicit date, reads back correctly', async () => {
    const p = await createPerson({ name: 'Alice' })
    const obs = await createObservation({
      personId: p.id,
      text: 'saw something interesting',
      occurredOn: '2026-06-15',
    })
    expect(obs.text).toBe('saw something interesting')
    expect(obs.occurredOn).toBe('2026-06-15')
    expect(obs.personId).toBe(p.id)

    const fetched = await getObservation(obs.id)
    expect(fetched?.text).toBe('saw something interesting')
  })

  it('default occurredOn is a valid YYYY-MM-DD local date', async () => {
    const p = await createPerson({ name: 'Bob' })
    const obs = await createObservation({ personId: p.id, text: 'note' })
    expect(obs.occurredOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('timeline is ordered by occurredOn descending (newest first)', async () => {
    const p = await createPerson({ name: 'Charlie' })
    await createObservation({ personId: p.id, text: 'old', occurredOn: '2026-01-01' })
    await createObservation({ personId: p.id, text: 'mid', occurredOn: '2026-03-15' })
    await createObservation({ personId: p.id, text: 'new', occurredOn: '2026-06-21' })

    const timeline = await listObservationsByPerson(p.id)
    expect(timeline.map((o) => o.occurredOn)).toEqual(['2026-06-21', '2026-03-15', '2026-01-01'])
  })

  it('update observation text persists', async () => {
    const p = await createPerson({ name: 'Dana' })
    const obs = await createObservation({ personId: p.id, text: 'original', occurredOn: '2026-06-01' })
    await updateObservation(obs.id, { text: 'revised' })
    const fetched = await getObservation(obs.id)
    expect(fetched?.text).toBe('revised')
  })

  it('rejects empty observation text at create time', async () => {
    const p = await createPerson({ name: 'Eve' })
    await expect(createObservation({ personId: p.id, text: '' })).rejects.toThrow()
  })

  it('deleting person removes all their observations', async () => {
    const p = await createPerson({ name: 'Frank' })
    await createObservation({ personId: p.id, text: 'obs 1', occurredOn: '2026-06-01' })
    await createObservation({ personId: p.id, text: 'obs 2', occurredOn: '2026-06-02' })

    await deletePerson(p.id)

    expect(await listObservationsByPerson(p.id)).toHaveLength(0)
  })
})

// TC-R-06
describe('TC-R-06 — delete observation cascades to evidence only', () => {
  it('removes evidence but leaves the parent person intact', async () => {
    const p = await createPerson({ name: 'Grace' })
    const obs = await createObservation({ personId: p.id, text: 'test', occurredOn: '2026-06-01' })
    const now = new Date().toISOString()
    await db.evidence.add({
      id: 'ev-t08',
      observationId: obs.id,
      framework: 'BIG_FIVE',
      dimension: 'O',
      direction: 1,
      weight: 2,
    })

    await deleteObservation(obs.id)

    expect(await getObservation(obs.id)).toBeUndefined()
    expect(await db.evidence.where('observationId').equals(obs.id).count()).toBe(0)
    expect(await getPerson(p.id)).toBeDefined()
    void now // suppress unused warning
  })
})

// T-09 evidence repository tests
describe('T-09 — evidence persistence', () => {
  it('adds Big Five evidence and reads it back', async () => {
    const p = await createPerson({ name: 'Test' })
    const obs = await createObservation({ personId: p.id, text: 'note', occurredOn: '2026-06-21' })

    const ev = await addEvidence({
      observationId: obs.id,
      framework: 'BIG_FIVE',
      dimension: 'O',
      direction: 1,
      weight: 2,
    })
    expect(ev.framework).toBe('BIG_FIVE')
    expect(ev.dimension).toBe('O')

    const list = await listEvidenceForObservation(obs.id)
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(ev.id)
  })

  it('adds MBTI evidence with valid pole, reads it back', async () => {
    const p = await createPerson({ name: 'Test2' })
    const obs = await createObservation({ personId: p.id, text: 'note', occurredOn: '2026-06-21' })

    const ev = await addEvidence({
      observationId: obs.id,
      framework: 'MBTI',
      axis: 'TF',
      pole: 'T',
      weight: 3,
    })
    expect(ev.axis).toBe('TF')
    expect(ev.pole).toBe('T')
  })

  it('rejects MBTI evidence with invalid pole for axis', async () => {
    const p = await createPerson({ name: 'Test3' })
    const obs = await createObservation({ personId: p.id, text: 'note', occurredOn: '2026-06-21' })

    await expect(
      addEvidence({
        observationId: obs.id,
        framework: 'MBTI',
        axis: 'EI',
        pole: 'T', // T is not a valid pole for EI
        weight: 1,
      }),
    ).rejects.toThrow()
  })

  it('removes a single evidence item without affecting others', async () => {
    const p = await createPerson({ name: 'Test4' })
    const obs = await createObservation({ personId: p.id, text: 'note', occurredOn: '2026-06-21' })

    const ev1 = await addEvidence({ observationId: obs.id, framework: 'BIG_FIVE', dimension: 'O', direction: 1, weight: 1 })
    const ev2 = await addEvidence({ observationId: obs.id, framework: 'BIG_FIVE', dimension: 'C', direction: -1, weight: 2 })

    await removeEvidence(ev1.id)

    const list = await listEvidenceForObservation(obs.id)
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(ev2.id)
  })

  it('an observation with zero evidence items is valid', async () => {
    const p = await createPerson({ name: 'Test5' })
    const obs = await createObservation({ personId: p.id, text: 'pure note', occurredOn: '2026-06-21' })

    const list = await listEvidenceForObservation(obs.id)
    expect(list).toHaveLength(0)
  })
})
