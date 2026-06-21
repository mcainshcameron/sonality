import { z } from 'zod'
import { AXIS_POLES } from './types'

// --- shared primitives ---
const uuidSchema = z.string().uuid()
const isoDatetimeSchema = z.string().datetime()
const weightSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])

// --- Person (§3.2) ---
export const PersonSchema = z.object({
  id: uuidSchema,
  name: z.string().trim().min(1, 'Name is required').max(120),
  relationship: z.string().max(60).optional(),
  notes: z.string().max(5000).optional(),
  archived: z.boolean(),
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema,
})

// --- Observation (§3.2) ---
export const ObservationSchema = z.object({
  id: uuidSchema,
  personId: uuidSchema,
  text: z.string().trim().min(1, 'Observation text is required').max(5000),
  occurredOn: z.string().date(), // YYYY-MM-DD (Zod ≥3.22)
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema,
})

// --- Evidence — discriminated union (§3.2) ---
// BIG_FIVE branch: dimension + direction required; axis/pole must be absent.
const BigFiveEvidenceSchema = z.object({
  id: uuidSchema,
  observationId: uuidSchema,
  framework: z.literal('BIG_FIVE'),
  dimension: z.enum(['O', 'C', 'E', 'A', 'N']),
  direction: z.union([z.literal(1), z.literal(-1)]),
  axis: z.undefined().optional(),
  pole: z.undefined().optional(),
  weight: weightSchema,
})

// MBTI branch: axis + pole required; dimension/direction must be absent.
// Pole-axis cross-validation is in the superRefine below — .refine() on a
// ZodObject cannot be used directly inside discriminatedUnion (Zod limitation).
const MbtiEvidenceSchema = z.object({
  id: uuidSchema,
  observationId: uuidSchema,
  framework: z.literal('MBTI'),
  dimension: z.undefined().optional(),
  direction: z.undefined().optional(),
  axis: z.enum(['EI', 'SN', 'TF', 'JP']),
  pole: z.enum(['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P']),
  weight: weightSchema,
})

export const EvidenceSchema = z
  .discriminatedUnion('framework', [BigFiveEvidenceSchema, MbtiEvidenceSchema])
  .superRefine((data, ctx) => {
    if (data.framework === 'MBTI') {
      const validPoles = AXIS_POLES[data.axis] as readonly string[]
      if (!validPoles.includes(data.pole)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'pole must belong to the specified axis',
          path: ['pole'],
        })
      }
    }
  })

// --- Export payload (§10.1) ---
export const ExportPayloadSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: isoDatetimeSchema,
  people: z.array(PersonSchema),
  observations: z.array(ObservationSchema),
  evidence: z.array(EvidenceSchema),
})

// Inferred types — used at validation boundaries (data layer, portability)
export type ValidatedPerson = z.infer<typeof PersonSchema>
export type ValidatedObservation = z.infer<typeof ObservationSchema>
export type ValidatedEvidence = z.infer<typeof EvidenceSchema>
export type ExportPayload = z.infer<typeof ExportPayloadSchema>
