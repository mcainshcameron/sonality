import { db } from './db'
import { ExportPayloadSchema } from '../domain/schema'
import type { Person, Observation, Evidence } from '../domain/types'

export const SCHEMA_VERSION = 1

export interface ExportPayload {
  schemaVersion: number
  exportedAt: string
  people: Person[]
  observations: Observation[]
  evidence: Evidence[]
}

/** Gather the entire local dataset into a versioned export payload (§10.1). */
export async function exportData(exportedAt: string): Promise<ExportPayload> {
  const [people, observations, evidence] = await Promise.all([
    db.people.toArray(),
    db.observations.toArray(),
    db.evidence.toArray(),
  ])
  return { schemaVersion: SCHEMA_VERSION, exportedAt, people, observations, evidence }
}

/** Serialize the current dataset to a JSON string. */
export async function exportToJson(exportedAt: string): Promise<string> {
  return JSON.stringify(await exportData(exportedAt), null, 2)
}

export class ImportError extends Error {}

/**
 * Validate a parsed payload against the schema AND referential closure of the
 * resulting dataset (§10.2). Throws ImportError on any problem. Returns the
 * validated payload. `resultingDataset` is what the stores will contain AFTER
 * the import is applied (differs between Replace and Merge).
 */
function validatePayload(raw: unknown): ExportPayload {
  const parsed = ExportPayloadSchema.safeParse(raw)
  if (!parsed.success) {
    throw new ImportError(`Invalid file: ${parsed.error.issues[0]?.message ?? 'schema validation failed'}`)
  }
  return parsed.data
}

function assertReferentialClosure(
  people: ExportPayload['people'],
  observations: ExportPayload['observations'],
  evidence: ExportPayload['evidence'],
): void {
  const personIds = new Set(people.map((p) => p.id))
  for (const o of observations) {
    if (!personIds.has(o.personId)) {
      throw new ImportError(`Observation ${o.id} references missing person ${o.personId}`)
    }
  }
  const obsIds = new Set(observations.map((o) => o.id))
  for (const e of evidence) {
    if (!obsIds.has(e.observationId)) {
      throw new ImportError(`Evidence ${e.id} references missing observation ${e.observationId}`)
    }
  }
}

/** Parse a JSON string into a validated payload (schema only). */
export function parseImport(json: string): ExportPayload {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new ImportError('File is not valid JSON')
  }
  return validatePayload(raw)
}

/**
 * Replace mode (§10.3, MUST): wipe everything, insert the file verbatim.
 * All-or-nothing: validation happens before any write.
 */
export async function importReplace(json: string): Promise<void> {
  const payload = parseImport(json)
  assertReferentialClosure(payload.people, payload.observations, payload.evidence)

  await db.transaction('rw', db.people, db.observations, db.evidence, async () => {
    await Promise.all([db.people.clear(), db.observations.clear(), db.evidence.clear()])
    await db.people.bulkAdd(payload.people)
    await db.observations.bulkAdd(payload.observations)
    await db.evidence.bulkAdd(payload.evidence)
  })
}

/**
 * Merge mode (§10.4, SHOULD): upsert by id, imported wins on conflict,
 * timestamps preserved. Referential closure is checked against the UNION of
 * local + imported rows (imported replacing same-id local rows).
 */
export async function importMerge(json: string): Promise<void> {
  const payload = parseImport(json)

  await db.transaction('rw', db.people, db.observations, db.evidence, async () => {
    const [localPeople, localObs, localEvidence] = await Promise.all([
      db.people.toArray(),
      db.observations.toArray(),
      db.evidence.toArray(),
    ])

    const mergedPeople = upsertById(localPeople, payload.people)
    const mergedObs = upsertById(localObs, payload.observations)
    const mergedEvidence = upsertById(localEvidence, payload.evidence)

    assertReferentialClosure(mergedPeople, mergedObs, mergedEvidence)

    await db.people.bulkPut(payload.people)
    await db.observations.bulkPut(payload.observations)
    await db.evidence.bulkPut(payload.evidence)
  })
}

/** Clear all records from every store (FR-24). */
export async function clearAll(): Promise<void> {
  await db.transaction('rw', db.people, db.observations, db.evidence, async () => {
    await Promise.all([db.people.clear(), db.observations.clear(), db.evidence.clear()])
  })
}

// Deterministic upsert-by-id: imported rows replace same-id local rows.
function upsertById<T extends { id: string }>(local: T[], imported: T[]): T[] {
  const byId = new Map(local.map((r) => [r.id, r]))
  for (const r of imported) byId.set(r.id, r)
  return [...byId.values()]
}
