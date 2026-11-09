import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Terminal } from './Terminal.tsx'

describe('Terminal', () => {
  it('shows a welcome message and a prompt', () => {
    render(<Terminal />)

    expect(
      screen.getByRole('main', { name: 'Terminal portfolio' }),
    ).toBeTruthy()
    expect(screen.getByText('Welcome to the terminal portfolio.')).toBeTruthy()
    expect(screen.getByText('visitor@portfolio')).toBeTruthy()
    expect(screen.getByText('$')).toBeTruthy()
  })
})
