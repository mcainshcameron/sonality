import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import EvidencePicker from './EvidencePicker'

afterEach(cleanup)

const noop = vi.fn()

// TC-U-02
describe('TC-U-02 — EvidencePicker offers only valid poles per axis and shows labels', () => {
  it('MBTI axis EI offers exactly poles E and I (not S/N/T/F/J/P)', () => {
    render(<EvidencePicker observationId="o1" existing={[]} onAdd={noop} onRemove={noop} />)
    // Switch to MBTI
    fireEvent.click(screen.getByRole('button', { name: 'MBTI' }))

    const poleSelect = screen.getByLabelText('Pole') as HTMLSelectElement
    const options = within(poleSelect)
      .getAllByRole('option')
      .map((o) => (o as HTMLOptionElement).value)
    expect(options).toEqual(['E', 'I'])
  })

  it('changing axis to TF updates the pole options to T and F', () => {
    render(<EvidencePicker observationId="o1" existing={[]} onAdd={noop} onRemove={noop} />)
    fireEvent.click(screen.getByRole('button', { name: 'MBTI' }))

    fireEvent.change(screen.getByLabelText('Axis'), { target: { value: 'TF' } })
    const poleSelect = screen.getByLabelText('Pole') as HTMLSelectElement
    const options = within(poleSelect)
      .getAllByRole('option')
      .map((o) => (o as HTMLOptionElement).value)
    expect(options).toEqual(['T', 'F'])
  })

  it('Big Five direction options carry the plain-language pole labels (FR-15)', () => {
    render(<EvidencePicker observationId="o1" existing={[]} onAdd={noop} onRemove={noop} />)
    // Default framework is Big Five; dimension O
    expect(screen.getByText(/Open — curious/)).toBeDefined()
    expect(screen.getByText(/Conventional — practical/)).toBeDefined()
  })

  it('weight options show their signal labels', () => {
    render(<EvidencePicker observationId="o1" existing={[]} onAdd={noop} onRemove={noop} />)
    const weightSelect = screen.getByLabelText('Weight')
    expect(within(weightSelect).getByText(/weak signal/i)).toBeDefined()
    expect(within(weightSelect).getByText(/moderate signal/i)).toBeDefined()
    expect(within(weightSelect).getByText(/strong signal/i)).toBeDefined()
  })

  it('clicking Add submits a well-formed Big Five evidence object', () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    render(<EvidencePicker observationId="o1" existing={[]} onAdd={onAdd} onRemove={noop} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add evidence' }))
    expect(onAdd).toHaveBeenCalledWith({
      observationId: 'o1',
      framework: 'BIG_FIVE',
      dimension: 'O',
      direction: 1,
      weight: 2,
    })
  })
})
