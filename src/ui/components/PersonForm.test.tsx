import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import PersonForm from './PersonForm'

afterEach(cleanup)

const noop = vi.fn()

// TC-U-01
describe('TC-U-01 — PersonForm blocks empty name with inline error', () => {
  it('shows alert and does not call onSubmit when name is empty', () => {
    const onSubmit = vi.fn()
    render(<PersonForm onSubmit={onSubmit} onCancel={noop} />)

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByRole('alert')).toBeDefined()
    expect(screen.getByText('Name is required')).toBeDefined()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows alert when name is whitespace only', () => {
    const onSubmit = vi.fn()
    render(<PersonForm onSubmit={onSubmit} onCancel={noop} />)

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByRole('alert')).toBeDefined()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('clears the error once a valid name is typed', () => {
    render(<PersonForm onSubmit={noop} onCancel={noop} />)

    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(screen.getByRole('alert')).toBeDefined()

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Alice' } })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn()
    render(<PersonForm onSubmit={noop} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
