import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { COMMANDS } from './commandParser.ts'
import { about, projects } from './content.ts'
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

    fireEvent.change(input, { target: { value: 'resume' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getByText('resume')).toBeTruthy()
    expect(screen.getByRole('log').textContent).toContain('Education')
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

  it('lists every known command when help is run', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    fireEvent.change(input, { target: { value: 'help' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const log = screen.getByRole('log')
    for (const command of COMMANDS) {
      expect(log.textContent).toContain(command.name)
      expect(log.textContent).toContain(command.description)
    }
  })

  it('prints the about introduction', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    fireEvent.change(input, { target: { value: 'about' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const log = screen.getByRole('log')
    expect(screen.getByText('about')).toBeTruthy()
    expect(log.textContent).toContain(about.name)
    expect(log.textContent).toContain(about.introduction)
    expect(log.textContent).toContain(about.focus)
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('lists each project with a clickable GitHub link', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    fireEvent.change(input, { target: { value: 'projects' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const log = screen.getByRole('log')
    for (const project of projects) {
      expect(log.textContent).toContain(project.name)
      expect(log.textContent).toContain(project.description)
      const link = screen.getByRole('link', { name: project.url })
      expect(link.getAttribute('href')).toBe(project.url)
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    }
  })

  it('clears the scrollback and keeps the prompt usable', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    fireEvent.change(input, { target: { value: 'about' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText(about.name)).toBeTruthy()

    fireEvent.change(input, { target: { value: 'clear' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getByRole('log').textContent).toBe('')
    expect(input).toHaveProperty('value', '')
    expect(screen.getByText('visitor@portfolio')).toBeTruthy()
    expect(screen.queryByText(about.name)).toBeNull()

    fireEvent.change(input, { target: { value: 'help' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getByText('help')).toBeTruthy()
    expect(screen.getByRole('log').textContent).toContain('List available commands')
    expect(screen.queryByText(about.name)).toBeNull()
  })

  it('recalls earlier commands with the up and down arrow keys', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    fireEvent.change(input, { target: { value: 'help' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.change(input, { target: { value: 'about' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.change(input, { target: { value: 'projects' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(fireEvent.keyDown(input, { key: 'ArrowUp' })).toBe(false)
    expect(input).toHaveProperty('value', 'projects')
    expect(input).toHaveProperty('selectionStart', 'projects'.length)
    expect(input).toHaveProperty('selectionEnd', 'projects'.length)

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveProperty('value', 'about')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveProperty('value', 'help')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveProperty('value', 'help')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveProperty('value', 'about')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveProperty('value', 'projects')
    expect(fireEvent.keyDown(input, { key: 'ArrowDown' })).toBe(false)
    expect(input).toHaveProperty('value', '')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveProperty('value', '')

    expect(screen.getAllByText('help')).toHaveLength(1)
    expect(screen.getAllByText('about')).toHaveLength(1)
    expect(screen.getAllByText('projects')).toHaveLength(1)
  })

  it('replaces an unsubmitted draft and returns to an empty line', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    fireEvent.change(input, { target: { value: 'help' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.change(input, { target: { value: 'not submitted' } })
    fireEvent.keyDown(input, { key: 'ArrowUp' })

    expect(input).toHaveProperty('value', 'help')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveProperty('value', '')
    expect(screen.getByRole('log').textContent).not.toContain('not submitted')
  })

  it('runs a recalled command and skips empty or duplicate history entries', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    fireEvent.change(input, { target: { value: 'help' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.change(input, { target: { value: 'help' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveProperty('value', 'help')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveProperty('value', 'help')

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(input).toHaveProperty('value', '')
    expect(screen.getAllByText('help')).toHaveLength(3)

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveProperty('value', 'help')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveProperty('value', 'help')
  })

  it('completes a command name when Tab is pressed', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    fireEvent.change(input, { target: { value: 'proj' } })
    expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(false)

    expect(input).toHaveProperty('value', 'projects ')
    expect(input).toHaveProperty('selectionStart', 'projects '.length)
    expect(input).toHaveProperty('selectionEnd', 'projects '.length)
    expect(document.activeElement).toBe(input)
    expect(screen.getByRole('log').textContent).toBe('')

    expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(false)
    expect(input).toHaveProperty('value', 'projects ')
    expect(screen.getByRole('log').textContent).toBe('')
  })

  it('lists command names when Tab cannot extend the input', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(false)
    expect(input).toHaveProperty('value', '')
    expect(document.activeElement).toBe(input)

    const log = screen.getByRole('log')
    for (const command of COMMANDS) {
      expect(log.textContent).toContain(command.name)
    }

    fireEvent.change(input, { target: { value: 'help extra' } })
    fireEvent.keyDown(input, { key: 'Tab' })
    expect(input).toHaveProperty('value', 'help extra')
    expect(log.textContent).not.toContain('help extra')
  })

  it('leaves the draft alone while an IME composition is active', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    fireEvent.change(input, { target: { value: 'help' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.change(input, { target: { value: 'draft' } })
    fireEvent.keyDown(input, { key: 'ArrowUp', isComposing: true })

    expect(input).toHaveProperty('value', 'draft')
    expect(screen.getAllByText('help')).toHaveLength(1)
  })
})
