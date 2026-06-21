import { db } from './db'
import type { Observation } from '../domain/types'
import { ObservationSchema } from '../domain/schema'
import { localDateString } from '../utils/date'

export async function createObservation(data: {
  personId: string
  text: string
  occurredOn?: string // YYYY-MM-DD; defaults to local calendar date (D-12)
}): Promise<Observation> {
  const now = new Date().toISOString()
  const obs: Observation = {
    id: crypto.randomUUID(),
    personId: data.personId,
    text: data.text.trim(),
    occurredOn: data.occurredOn ?? localDateString(),
    createdAt: now,
    updatedAt: now,
  }
  ObservationSchema.parse(obs)
  await db.observations.add(obs)
  return obs
}

export async function getObservation(id: string): Promise<Observation | undefined> {
  return db.observations.get(id)
}

export async function updateObservation(
  id: string,
  data: Partial<Pick<Observation, 'text' | 'occurredOn'>>,
): Promise<Observation> {
  const existing = await db.observations.get(id)
  if (!existing) throw new Error(`Observation ${id} not found`)
  const updated: Observation = {
    ...existing,
    ...data,
    text: data.text !== undefined ? data.text.trim() : existing.text,
    updatedAt: new Date().toISOString(),
  }
  ObservationSchema.parse(updated)
  await db.observations.put(updated)
  return updated
}

export async function deleteObservation(id: string): Promise<void> {
  await db.transaction('rw', db.observations, db.evidence, async () => {
    await db.evidence.where('observationId').equals(id).delete()
    await db.observations.delete(id)
  })
}

export async function listObservationsByPerson(personId: string): Promise<Observation[]> {
  const obs = await db.observations.where('personId').equals(personId).toArray()
  return obs.sort((a, b) => {
    const d = b.occurredOn.localeCompare(a.occurredOn)
    return d !== 0 ? d : b.createdAt.localeCompare(a.createdAt)
  })
}

