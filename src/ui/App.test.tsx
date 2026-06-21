import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('mounts and renders the app heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Sonality' })).toBeDefined()
  })
})
