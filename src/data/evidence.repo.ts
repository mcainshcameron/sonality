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
  await db.evidence.add(evidence)
  return evidence
}

export async function removeEvidence(id: string): Promise<void> {
  await db.evidence.delete(id)
}

export async function listEvidenceForObservation(observationId: string): Promise<Evidence[]> {
  return db.evidence.where('observationId').equals(observationId).toArray()
}
