import { db } from './db'
import type { Person } from '../domain/types'
import { PersonSchema } from '../domain/schema'

export interface PeopleFilter {
  search?: string
  relationship?: string
  includeArchived?: boolean
}

export type PersonWithCount = Person & { observationCount: number }

export async function createPerson(
  data: Pick<Person, 'name'> & Partial<Pick<Person, 'relationship' | 'notes'>>,
): Promise<Person> {
  const now = new Date().toISOString()
  const person: Person = {
    id: crypto.randomUUID(),
    name: data.name.trim(),
    relationship: data.relationship,
    notes: data.notes,
    archived: false,
    createdAt: now,
    updatedAt: now,
  }
  PersonSchema.parse(person)
  await db.people.add(person)
  return person
}

export async function getPerson(id: string): Promise<Person | undefined> {
  return db.people.get(id)
}

export async function updatePerson(
  id: string,
  data: Partial<Pick<Person, 'name' | 'relationship' | 'notes' | 'archived'>>,
): Promise<Person> {
  const existing = await db.people.get(id)
  if (!existing) throw new Error(`Person ${id} not found`)
  const updated: Person = {
    ...existing,
    ...data,
    name: data.name !== undefined ? data.name.trim() : existing.name,
    updatedAt: new Date().toISOString(),
  }
  PersonSchema.parse(updated)
  await db.people.put(updated)
  return updated
}

export async function deletePerson(id: string): Promise<void> {
  await db.transaction('rw', db.people, db.observations, db.evidence, async () => {
    const obsIds = await db.observations.where('personId').equals(id).primaryKeys()
    if (obsIds.length > 0) {
      await db.evidence.where('observationId').anyOf(obsIds as string[]).delete()
    }
    await db.observations.where('personId').equals(id).delete()
    await db.people.delete(id)
  })
}

export async function archivePerson(id: string, archived: boolean): Promise<void> {
  await updatePerson(id, { archived })
}

export async function listPeople(filter?: PeopleFilter): Promise<PersonWithCount[]> {
  let people = await db.people.toArray()

  if (!filter?.includeArchived) {
    people = people.filter((p) => !p.archived)
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase()
    people = people.filter((p) => p.name.toLowerCase().includes(q))
  }
  if (filter?.relationship) {
    people = people.filter((p) => p.relationship === filter.relationship)
  }

  people.sort((a, b) => a.name.localeCompare(b.name))

  return Promise.all(
    people.map(async (p) => ({
      ...p,
      observationCount: await db.observations.where('personId').equals(p.id).count(),
    })),
  )
}
