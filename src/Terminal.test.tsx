import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Terminal } from './Terminal.tsx'

afterEach(() => {
  cleanup()
})

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

  it('focuses the command input on load', () => {
    render(<Terminal />)

    expect(document.activeElement).toBe(
      screen.getByRole('textbox', { name: 'Command' }),
    )
  })

  it('appends a typed command to the log when Enter is pressed', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    fireEvent.change(input, { target: { value: 'help' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getByText('help')).toBeTruthy()
    expect(screen.getByText('help: coming soon')).toBeTruthy()
    expect(input).toHaveProperty('value', '')
  })

  it('prints command not found for an unknown command', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    fireEvent.change(input, { target: { value: 'ls -la' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getByText('ls -la')).toBeTruthy()
    expect(screen.getByText('command not found: ls')).toBeTruthy()
  })
})
