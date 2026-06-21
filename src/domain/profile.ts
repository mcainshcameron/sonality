import type { Evidence, Profile, DimensionScore, AxisResult, BigFiveDimension, MbtiAxis, MbtiPole } from './types'
import { BIG_FIVE_ORDER, MBTI_AXIS_ORDER, AXIS_POLES } from './types'

/**
 * Pure function — no clock, no RNG. Given a personId and their full evidence
 * set, returns a Profile. Identical inputs always produce identical outputs
 * regardless of array order (NFR-05, §5.3).
 */
export function computeProfile(personId: string, evidence: Evidence[]): Profile {
  return {
    personId,
    bigFive: BIG_FIVE_ORDER.map((dim) => computeDimensionScore(dim, evidence)),
    mbti: computeMbti(evidence),
  }
}

// §5.1 — Big Five dimension score
function computeDimensionScore(dimension: BigFiveDimension, evidence: Evidence[]): DimensionScore {
  const ed = evidence.filter((e) => e.framework === 'BIG_FIVE' && e.dimension === dimension)

  if (ed.length === 0) {
    return { dimension, score: null, evidenceCount: 0, totalWeight: 0 }
  }

  let signed = 0
  let maxAbs = 0
  for (const e of ed) {
    // direction is always defined for BIG_FIVE evidence (Zod schema enforces this)
    signed += e.direction! * e.weight
    maxAbs += e.weight
  }

  return {
    dimension,
    score: Math.round(50 + 50 * (signed / maxAbs)),
    evidenceCount: ed.length,
    totalWeight: maxAbs,
  }
}

// §5.2 — MBTI axes and type assembly
function computeMbti(evidence: Evidence[]): Profile['mbti'] {
  const axes = MBTI_AXIS_ORDER.map((axis) => computeAxisResult(axis, evidence))
  return {
    type: axes.map((a) => a.winner ?? '?').join(''),
    complete: axes.every((a) => a.status === 'decided'),
    axes,
  }
}

function computeAxisResult(axis: MbtiAxis, evidence: Evidence[]): AxisResult {
  const [p1, p2] = AXIS_POLES[axis]

  const tally: Record<MbtiPole, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }

  for (const e of evidence) {
    if (e.framework === 'MBTI' && e.axis === axis && e.pole !== undefined) {
      tally[e.pole] += e.weight
    }
  }

  const total = tally[p1] + tally[p2]

  if (total === 0) {
    return { axis, winner: null, tally, confidence: null, status: 'no-data' }
  }

  if (tally[p1] === tally[p2]) {
    return { axis, winner: null, tally, confidence: 0, status: 'tie' }
  }

  const winner: MbtiPole = tally[p1] > tally[p2] ? p1 : p2
  const confidence = Math.abs(tally[p1] - tally[p2]) / total

  return { axis, winner, tally, confidence, status: 'decided' }
}
