import Dexie, { type EntityTable } from 'dexie'
import type { Person, Observation, Evidence } from '../domain/types'

interface MetaRow {
  key: string
  value: unknown
}

class SonalityDB extends Dexie {
  people!: EntityTable<Person, 'id'>
  observations!: EntityTable<Observation, 'id'>
  evidence!: EntityTable<Evidence, 'id'>
  meta!: EntityTable<MetaRow, 'key'>

  constructor() {
    super('sonality')
    this.version(1).stores({
      people: '&id, name, archived, updatedAt',
      observations: '&id, personId, occurredOn, updatedAt',
      evidence: '&id, observationId, framework',
      meta: '&key',
    })
  }
}

export const db = new SonalityDB()

export async function getSchemaVersion(): Promise<number | undefined> {
  const row = await db.meta.get('schemaVersion')
  return row?.value as number | undefined
}

export async function initMeta(): Promise<void> {
  await db.meta.put({ key: 'schemaVersion', value: 1 })
}
