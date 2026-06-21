import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import MbtiTypeView from './MbtiTypeView'
import { computeProfile } from '../../domain/profile'
import type { Evidence, MbtiAxis, MbtiPole, Weight } from '../../domain/types'

afterEach(cleanup)

function mb(i: number, axis: MbtiAxis, pole: MbtiPole, w: Weight): Evidence {
  return { id: `e${i}`, observationId: `o${i}`, framework: 'MBTI', axis, pole, weight: w }
}

// TC-U-04
describe('TC-U-04 — MbtiTypeView renders ? for undecided axis and flags incomplete', () => {
  it('shows the type with ? and an "incomplete" flag when an axis has no data', () => {
    // Only EI decided; SN/TF/JP have no data → type starts with E then ???
    const profile = computeProfile('p', [mb(1, 'EI', 'E', 2)])
    render(<MbtiTypeView mbti={profile.mbti} />)

    expect(screen.getByText('E???')).toBeDefined()
    expect(screen.getByText(/incomplete/i)).toBeDefined()
    expect(screen.getAllByText(/no data/i).length).toBeGreaterThan(0)
  })

  it('renders a tie as "tie (?)"', () => {
    const profile = computeProfile('p', [mb(1, 'TF', 'T', 2), mb(2, 'TF', 'F', 2)])
    render(<MbtiTypeView mbti={profile.mbti} />)
    expect(screen.getByText(/tie/i)).toBeDefined()
  })
})

// TC-U-08 (MBTI half)
describe('TC-U-08 — MbtiTypeView renders confidence as an integer %', () => {
  it('shows 33% for a 2:1 split (confidence 1/3)', () => {
    const profile = computeProfile('p', [mb(1, 'EI', 'E', 2), mb(2, 'EI', 'I', 1)])
    render(<MbtiTypeView mbti={profile.mbti} />)
    expect(screen.getByText('33%')).toBeDefined()
  })

  it('shows 100% for a single-pole axis', () => {
    const profile = computeProfile('p', [mb(1, 'EI', 'E', 3)])
    render(<MbtiTypeView mbti={profile.mbti} />)
    expect(screen.getByText('100%')).toBeDefined()
  })
})
