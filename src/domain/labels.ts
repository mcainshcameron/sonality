import type { BigFiveDimension, Direction, MbtiAxis, MbtiPole, Weight } from './types'

// Canonical labels from 02-technical-design.md §11 — single source of truth for UI

export const BIG_FIVE_LABELS: Record<
  BigFiveDimension,
  { name: string; high: string; low: string }
> = {
  O: {
    name: 'Openness',
    high: 'Open — curious, imaginative, novelty-seeking',
    low: 'Conventional — practical, routine-preferring',
  },
  C: {
    name: 'Conscientiousness',
    high: 'Conscientious — organized, dependable, disciplined',
    low: 'Flexible — spontaneous, easy-going about structure',
  },
  E: {
    name: 'Extraversion',
    high: 'Extraverted — outgoing, energized by people',
    low: 'Introverted — reserved, energized by solitude',
  },
  A: {
    name: 'Agreeableness',
    high: 'Agreeable — compassionate, cooperative, trusting',
    low: 'Detached — skeptical, competitive, blunt',
  },
  N: {
    name: 'Neuroticism',
    high: 'Reactive — prone to stress, worry, mood swings',
    low: 'Calm — emotionally stable, even-keeled',
  },
}

export const DIRECTION_LABELS: Record<Direction, string> = {
  1: 'High pole (+1)',
  [-1]: 'Low pole (−1)',
}

export const MBTI_LABELS: Record<MbtiAxis, Partial<Record<MbtiPole, string>>> = {
  EI: {
    E: 'E — Extraversion: energized by people/action',
    I: 'I — Introversion: energized by solitude/reflection',
  },
  SN: {
    S: 'S — Sensing: concrete, detail- and fact-focused',
    N: 'N — Intuition: abstract, pattern- and possibility-focused',
  },
  TF: {
    T: 'T — Thinking: decides by logic and consistency',
    F: 'F — Feeling: decides by values and impact on people',
  },
  JP: {
    J: 'J — Judging: prefers planning and closure',
    P: 'P — Perceiving: prefers flexibility and openness',
  },
}

export const WEIGHT_LABELS: Record<Weight, string> = {
  1: 'Weak signal',
  2: 'Moderate signal',
  3: 'Strong signal',
}

export function getPoleLabel(axis: MbtiAxis, pole: MbtiPole): string {
  const axisLabels = MBTI_LABELS[axis] as Record<string, string>
  return axisLabels[pole] ?? pole
}
