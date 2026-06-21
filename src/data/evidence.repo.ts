import { db } from './db'
import type { Evidence } from '../domain/types'
import { EvidenceSchema } from '../domain/schema'

export async function addEvidence(
  data: Omit<Evidence, 'id'>,
): Promise<Evidence> {
  const evidence: Evidence = {
    id: crypto.randomUUID(),
    ...data,
  }
  EvidenceSchema.parse(evidence)
  // Referential integrity (§4, NFR-06): reject evidence for a missing observation.
  const parent = await db.observations.get(evidence.observationId)
  if (!parent) {
    throw new Error(`Evidence references missing observation ${evidence.observationId}`)
  }
  await db.evidence.add(evidence)
  return evidence
}

export async function removeEvidence(id: string): Promise<void> {
  await db.evidence.delete(id)
}

export async function listEvidenceForObservation(observationId: string): Promise<Evidence[]> {
  return db.evidence.where('observationId').equals(observationId).toArray()
}

/** All evidence across every observation belonging to one person (for profile compute). */
export async function listEvidenceForPerson(personId: string): Promise<Evidence[]> {
  const obsIds = await db.observations.where('personId').equals(personId).primaryKeys()
  if (obsIds.length === 0) return []
  return db.evidence.where('observationId').anyOf(obsIds as string[]).toArray()
}
