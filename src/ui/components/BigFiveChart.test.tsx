import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import BigFiveChart from './BigFiveChart'
import type { DimensionScore } from '../../domain/types'

afterEach(cleanup)

function dim(
  dimension: DimensionScore['dimension'],
  score: number | null,
  evidenceCount = 0,
  totalWeight = 0,
): DimensionScore {
  return { dimension, score, evidenceCount, totalWeight }
}

const FULL: DimensionScore[] = [
  dim('O', 67, 3, 6),
  dim('C', 50, 2, 4),
  dim('E', 100, 1, 2),
  dim('A', 0, 1, 2),
  dim('N', 25, 1, 4),
]

// TC-U-03
describe('TC-U-03 — BigFiveChart shows "insufficient data" for null dimension', () => {
  it('renders insufficient data text, not 50, for a null dimension', () => {
    const data: DimensionScore[] = [
      dim('O', 67, 3, 6),
      dim('C', null),
      dim('E', null),
      dim('A', null),
      dim('N', null),
    ]
    render(<BigFiveChart bigFive={data} />)
    expect(screen.getAllByText(/insufficient data/i).length).toBeGreaterThan(0)
  })

  it('shows an empty-state message when no dimension has evidence', () => {
    const data: DimensionScore[] = [
      dim('O', null),
      dim('C', null),
      dim('E', null),
      dim('A', null),
      dim('N', null),
    ]
    render(<BigFiveChart bigFive={data} />)
    expect(screen.getByText(/no big five evidence yet/i)).toBeDefined()
  })
})

// TC-U-08 (Big Five half)
describe('TC-U-08 — BigFiveChart exposes a table alternative', () => {
  it('toggles to a table view listing every dimension with its score', () => {
    render(<BigFiveChart bigFive={FULL} />)
    fireEvent.click(screen.getByRole('button', { name: /show table/i }))

    const table = screen.getByRole('table')
    expect(table).toBeDefined()
    // score 0 must be distinct from "insufficient data"
    expect(screen.getByText('0')).toBeDefined()
    expect(screen.getByText('67')).toBeDefined()
  })
})
