import { db } from './db'
import type { Person, Observation, Evidence } from '../domain/types'
import { BIG_FIVE_ORDER, MBTI_AXIS_ORDER, AXIS_POLES } from '../domain/types'

/**
 * Deterministic large-dataset generator for the A-06 scale target
 * (≤ 500 people / ≤ 10,000 observations). No randomness — a fixed pseudo
 * sequence so perf runs are reproducible (TC-N-03 / test strategy §5).
 */
export interface SeedOptions {
  people?: number
  observationsPerPerson?: number
  evidencePerObservation?: number
}

// Tiny deterministic LCG so the data is varied but reproducible.
function makeRng(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0xffffffff
  }
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0')
}

export function generateSeed(opts: SeedOptions = {}): {
  people: Person[]
  observations: Observation[]
  evidence: Evidence[]
} {
  const peopleCount = opts.people ?? 500
  const obsPer = opts.observationsPerPerson ?? 20
  const evPer = opts.evidencePerObservation ?? 2
  const rng = makeRng(42)

  const people: Person[] = []
  const observations: Observation[] = []
  const evidence: Evidence[] = []

  for (let i = 0; i < peopleCount; i++) {
    const pid = `person-${pad(i, 4)}`
    const ts = `2026-01-01T00:00:00.000Z`
    people.push({
      id: pid,
      name: `Person ${pad(i, 4)}`,
      relationship: i % 3 === 0 ? 'friend' : i % 3 === 1 ? 'colleague' : 'family',
      archived: i % 50 === 0,
      createdAt: ts,
      updatedAt: ts,
    })

    for (let j = 0; j < obsPer; j++) {
      const oid = `obs-${pad(i, 4)}-${pad(j, 3)}`
      const day = (j % 28) + 1
      const month = (j % 12) + 1
      observations.push({
        id: oid,
        personId: pid,
        text: `Observation ${j} for person ${i}: behaviour sample.`,
        occurredOn: `2026-${pad(month, 2)}-${pad(day, 2)}`,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      })

      for (let k = 0; k < evPer; k++) {
        const useBigFive = rng() < 0.5
        const weight = ((Math.floor(rng() * 3) + 1) as 1 | 2 | 3)
        if (useBigFive) {
          const dim = BIG_FIVE_ORDER[Math.floor(rng() * BIG_FIVE_ORDER.length)]
          evidence.push({
            id: `ev-${pad(i, 4)}-${pad(j, 3)}-${k}`,
            observationId: oid,
            framework: 'BIG_FIVE',
            dimension: dim,
            direction: rng() < 0.5 ? 1 : -1,
            weight,
          })
        } else {
          const axis = MBTI_AXIS_ORDER[Math.floor(rng() * MBTI_AXIS_ORDER.length)]
          const pole = AXIS_POLES[axis][rng() < 0.5 ? 0 : 1]
          evidence.push({
            id: `ev-${pad(i, 4)}-${pad(j, 3)}-${k}`,
            observationId: oid,
            framework: 'MBTI',
            axis,
            pole,
            weight,
          })
        }
      }
    }
  }

  return { people, observations, evidence }
}

/** Bulk-load a generated seed into the database (dev/perf use). */
export async function loadSeed(opts: SeedOptions = {}): Promise<void> {
  const { people, observations, evidence } = generateSeed(opts)
  await db.transaction('rw', db.people, db.observations, db.evidence, async () => {
    await db.people.bulkAdd(people)
    await db.observations.bulkAdd(observations)
    await db.evidence.bulkAdd(evidence)
  })
}
