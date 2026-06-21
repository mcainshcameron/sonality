import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import EvidenceBreakdown from './EvidenceBreakdown'
import type { Observation, Evidence } from '../../domain/types'

afterEach(cleanup)

const NOW = '2026-06-21T00:00:00.000Z'

function obs(id: string, text: string, occurredOn: string): Observation {
  return { id, personId: 'p1', text, occurredOn, createdAt: NOW, updatedAt: NOW }
}

// TC-U-05
describe('TC-U-05 — EvidenceBreakdown lists the exact contributing observations', () => {
  const observations = [
    obs('o1', 'organized their whole trip', '2026-06-10'),
    obs('o2', 'left dishes for days', '2026-06-12'),
  ]
  const evidence: Evidence[] = [
    { id: 'e1', observationId: 'o1', framework: 'BIG_FIVE', dimension: 'C', direction: 1, weight: 3 },
    { id: 'e2', observationId: 'o2', framework: 'BIG_FIVE', dimension: 'C', direction: -1, weight: 2 },
    { id: 'e3', observationId: 'o1', framework: 'BIG_FIVE', dimension: 'O', direction: 1, weight: 1 },
  ]

  it('expanding C lists exactly the two observations that drove it', () => {
    render(<EvidenceBreakdown observations={observations} evidence={evidence} />)
    // C row shows "2 obs"
    const cButton = screen.getByRole('button', { name: /Conscientiousness/i })
    fireEvent.click(cButton)
    expect(screen.getByText(/organized their whole trip/)).toBeDefined()
    expect(screen.getByText(/left dishes for days/)).toBeDefined()
  })
})

// TC-U-07
describe('TC-U-07 — expanding a dimension with no evidence shows the empty message', () => {
  it('shows "No observations tagged for this yet" and the expand control is present', () => {
    render(<EvidenceBreakdown observations={[obs('o1', 'note', '2026-06-10')]} evidence={[]} />)

    // N (Neuroticism) has no evidence — the control still exists
    const nButton = screen.getByRole('button', { name: /Neuroticism/i })
    expect(nButton).toBeDefined()
    fireEvent.click(nButton)
    expect(screen.getAllByText(/No observations tagged for this yet/i).length).toBeGreaterThan(0)
  })
})

// FR-21 strength indicator
describe('EvidenceBreakdown — shows a strength indicator per dimension', () => {
  it('displays obs count and total weight on a populated row', () => {
    const observations = [obs('o1', 'x', '2026-06-10')]
    const evidence: Evidence[] = [
      { id: 'e1', observationId: 'o1', framework: 'BIG_FIVE', dimension: 'O', direction: 1, weight: 3 },
    ]
    render(<EvidenceBreakdown observations={observations} evidence={evidence} />)
    const oButton = screen.getByRole('button', { name: /Openness/i })
    expect(within(oButton).getByText(/1 obs · weight 3/)).toBeDefined()
  })
})
