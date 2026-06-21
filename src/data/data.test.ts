import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'
import { createPerson, getPerson, updatePerson, deletePerson, listPeople, archivePerson } from './people.repo'

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
