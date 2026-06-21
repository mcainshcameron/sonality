// §3.1 — controlled vocabulary
export type Framework = 'BIG_FIVE' | 'MBTI'
export type BigFiveDimension = 'O' | 'C' | 'E' | 'A' | 'N'
export type Direction = 1 | -1
export type MbtiAxis = 'EI' | 'SN' | 'TF' | 'JP'
export type MbtiPole = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P'
export type Weight = 1 | 2 | 3

// Canonical orders referenced by the algorithm (§3.1, §5)
export const BIG_FIVE_ORDER: readonly BigFiveDimension[] = ['O', 'C', 'E', 'A', 'N']
export const MBTI_AXIS_ORDER: readonly MbtiAxis[] = ['EI', 'SN', 'TF', 'JP']
export const AXIS_POLES: Record<MbtiAxis, readonly [MbtiPole, MbtiPole]> = {
  EI: ['E', 'I'],
  SN: ['S', 'N'],
  TF: ['T', 'F'],
  JP: ['J', 'P'],
}

// §3.2 — entities
export interface Person {
  id: string
  name: string
  relationship?: string
  notes?: string
  archived: boolean
  createdAt: string
  updatedAt: string
}

export interface Observation {
  id: string
  personId: string
  text: string
  occurredOn: string // YYYY-MM-DD local date (D-12)
  createdAt: string
  updatedAt: string
}

export interface Evidence {
  id: string
  observationId: string
  framework: Framework
  // BIG_FIVE fields (undefined when framework === 'MBTI')
  dimension?: BigFiveDimension
  direction?: Direction
  // MBTI fields (undefined when framework === 'BIG_FIVE')
  axis?: MbtiAxis
  pole?: MbtiPole
  weight: Weight
}

// §3.4 — derived profile types (never stored; always recomputed from evidence)
export interface DimensionScore {
  dimension: BigFiveDimension
  score: number | null // null = no evidence ("insufficient data")
  evidenceCount: number
  totalWeight: number
}

export interface AxisResult {
  axis: MbtiAxis
  winner: MbtiPole | null // null when tied or no evidence
  tally: Record<MbtiPole, number>
  confidence: number | null // [0,1] float; null when no evidence
  status: 'decided' | 'tie' | 'no-data'
}

export interface Profile {
  personId: string
  bigFive: DimensionScore[] // length 5, order O,C,E,A,N
  mbti: {
    type: string // 4 chars, '?' for undecided axes
    complete: boolean
    axes: AxisResult[] // length 4, order EI,SN,TF,JP
  }
}
