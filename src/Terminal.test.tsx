import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { COMMANDS } from './commandParser.ts'
import { about, projects, resume } from './content.ts'
import { Terminal } from './Terminal.tsx'

afterEach(() => {
  cleanup()
})

function promptPaths(): string[] {
  return [...document.querySelectorAll('.terminal__path')].map(
    (element) => element.textContent ?? '',
  )
}

function runCommand(input: HTMLElement, line: string) {
  fireEvent.change(input, { target: { value: line } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

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

    fireEvent.change(input, { target: { value: 'vim -la' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getByText('vim -la')).toBeTruthy()
    expect(screen.getByText('command not found: vim')).toBeTruthy()
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

  it('lists the virtual root when ls is run', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    fireEvent.change(input, { target: { value: 'ls' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const log = screen.getByRole('log')
    expect(screen.getByText('ls')).toBeTruthy()
    expect(log.textContent).toContain('about.txt')
    expect(log.textContent).toContain('projects/')
    expect(log.textContent).toContain('resume.txt')
  })

  it('prints a project file and link when cat is run', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })
    const project = projects[0]

    fireEvent.change(input, {
      target: { value: `cat projects/${project.name}.txt` },
    })
    fireEvent.keyDown(input, { key: 'Enter' })

    const log = screen.getByRole('log')
    expect(log.textContent).toContain(project.description)
    const link = screen.getByRole('link', { name: project.url })
    expect(link.getAttribute('href')).toBe(project.url)
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('prints shell errors for cat', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    fireEvent.change(input, { target: { value: 'cat' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('cat: missing operand')).toBeTruthy()

    fireEvent.change(input, { target: { value: 'cat projects' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('cat: projects: Is a directory')).toBeTruthy()

    fireEvent.change(input, { target: { value: 'cat foo' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('cat: foo: No such file or directory')).toBeTruthy()
  })

  it('completes ls when Tab is pressed', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    fireEvent.change(input, { target: { value: 'l' } })
    expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(false)

    expect(input).toHaveProperty('value', 'ls ')
    expect(input).toHaveProperty('selectionStart', 'ls '.length)
    expect(screen.getByRole('log').textContent).toBe('')

    fireEvent.change(input, { target: { value: 'c' } })
    fireEvent.keyDown(input, { key: 'Tab' })

    expect(input).toHaveProperty('value', 'c')
    const log = screen.getByRole('log').textContent
    expect(log).toContain('clear')
    expect(log).toContain('cat')
  })

  it('prints the resume sections', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    fireEvent.change(input, { target: { value: 'resume' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const log = screen.getByRole('log')
    expect(screen.getByText('resume')).toBeTruthy()
    for (const section of resume) {
      expect(log.textContent).toContain(section.heading)
      for (const line of section.lines) {
        expect(log.textContent).toContain(line)
      }
    }
    expect(log.textContent).not.toContain('coming soon')
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('lists resume when help is run', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })
    const resumeCommand = COMMANDS.find((command) => command.name === 'resume')

    fireEvent.change(input, { target: { value: 'help' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const log = screen.getByRole('log')
    expect(log.textContent).toContain('resume')
    expect(log.textContent).toContain(resumeCommand?.description)
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

  it('shows the current directory in the prompt', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })
    const project = projects[0]

    expect(promptPaths()).toEqual([':~'])

    runCommand(input, 'cd projects')
    expect(promptPaths()).toEqual([':~', ':~/projects'])

    runCommand(input, 'pwd')
    expect(screen.getByText('~/projects')).toBeTruthy()
    expect(promptPaths()).toEqual([':~', ':~/projects', ':~/projects'])

    runCommand(input, 'ls')
    const log = screen.getByRole('log')
    for (const entry of projects) {
      expect(log.textContent).toContain(`${entry.name}.txt`)
    }
    expect(log.textContent).not.toContain('resume.txt')

    runCommand(input, `cat ${project.name}.txt`)
    expect(log.textContent).toContain(project.description)
    const link = screen.getByRole('link', { name: project.url })
    expect(link.getAttribute('href')).toBe(project.url)
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')

    runCommand(input, 'cat ../about.txt')
    expect(log.textContent).toContain(about.name)

    runCommand(input, 'cd ..')
    expect(promptPaths().at(-1)).toBe(':~')
    expect(promptPaths().at(-2)).toBe(':~/projects')

    runCommand(input, 'cd about.txt')
    expect(screen.getByText('cd: about.txt: Not a directory')).toBeTruthy()
    expect(promptPaths().at(-1)).toBe(':~')

    runCommand(input, 'cd nope')
    expect(
      screen.getByText('cd: nope: No such file or directory'),
    ).toBeTruthy()
    expect(promptPaths().at(-1)).toBe(':~')
  })

  it('keeps the current directory when the log is cleared', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    runCommand(input, 'cd projects')
    runCommand(input, 'clear')

    expect(screen.getByRole('log').textContent).toBe('')
    expect(promptPaths()).toEqual([':~/projects'])

    runCommand(input, 'pwd')
    expect(screen.getByText('~/projects')).toBeTruthy()
    expect(promptPaths()).toEqual([':~/projects', ':~/projects'])
  })

  it('completes a path argument when Tab is pressed', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })
    const nested = projects.filter((project) => project.name.startsWith('c'))
    expect(nested).toHaveLength(1)

    fireEvent.change(input, { target: { value: 'cat ab' } })
    expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(false)
    expect(input).toHaveProperty('value', 'cat about.txt')
    expect(input).toHaveProperty('selectionStart', 'cat about.txt'.length)
    expect(input).toHaveProperty('selectionEnd', 'cat about.txt'.length)
    expect(screen.getByRole('log').textContent).toBe('')

    fireEvent.change(input, { target: { value: 'cd pro' } })
    fireEvent.keyDown(input, { key: 'Tab' })
    expect(input).toHaveProperty('value', 'cd projects/')
    expect(input).toHaveProperty('selectionStart', 'cd projects/'.length)

    fireEvent.change(input, { target: { value: 'cat projects/' } })
    fireEvent.keyDown(input, { key: 'Tab' })
    const listed = screen.getByRole('log').textContent ?? ''
    for (const project of projects) {
      expect(listed).toContain(`${project.name}.txt`)
    }

    runCommand(input, 'cd projects')
    expect(promptPaths().at(-1)).toBe(':~/projects')

    fireEvent.change(input, { target: { value: 'cat c' } })
    fireEvent.keyDown(input, { key: 'Tab' })
    expect(input).toHaveProperty('value', `cat ${nested[0]?.name}.txt`)

    fireEvent.change(input, { target: { value: 'cd a' } })
    fireEvent.keyDown(input, { key: 'Tab' })
    expect(input).toHaveProperty('value', 'cd a')

    fireEvent.change(input, { target: { value: 'cat ../ab' } })
    fireEvent.keyDown(input, { key: 'Tab' })
    expect(input).toHaveProperty('value', 'cat ../about.txt')
  })

  it('completes cd and pwd when Tab is pressed', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    fireEvent.change(input, { target: { value: 'pw' } })
    expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(false)
    expect(input).toHaveProperty('value', 'pwd ')
    expect(input).toHaveProperty('selectionStart', 'pwd '.length)

    fireEvent.change(input, { target: { value: 'cd' } })
    fireEvent.keyDown(input, { key: 'Tab' })
    expect(input).toHaveProperty('value', 'cd ')
    expect(screen.getByRole('log').textContent).toBe('')
  })

  it('prints numbered history from earlier commands and keeps it after clear', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    runCommand(input, 'history')
    expect(screen.getByRole('log').textContent).toBe('visitor@portfolio:~$history')

    runCommand(input, 'help')
    runCommand(input, 'about')
    runCommand(input, '')
    runCommand(input, 'history')

    const listed = screen.getByRole('log').textContent ?? ''
    expect(listed).toContain('    1  history')
    expect(listed).toContain('    2  help')
    expect(listed).toContain('    3  about')
    expect(listed).not.toContain('    4 ')
    expect(listed).toContain('Print previous commands')

    runCommand(input, 'clear')
    expect(screen.getByRole('log').textContent).toBe('')

    runCommand(input, 'history')
    const afterClear = screen.getByRole('log').textContent ?? ''
    expect(afterClear).toContain('    1  history')
    expect(afterClear).toContain('    2  help')
    expect(afterClear).toContain('    3  about')
    expect(afterClear).toContain('    4  history')
    expect(afterClear).toContain('    5  clear')
    expect(afterClear).not.toContain('Print previous commands')
    expect(afterClear).not.toContain(about.name)

    fireEvent.change(input, { target: { value: 'hist' } })
    fireEvent.keyDown(input, { key: 'Tab' })
    expect(input).toHaveProperty('value', 'history ')
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

  it('clears the scrollback with Ctrl+L and keeps the draft, directory, and history', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    runCommand(input, 'cd projects')
    runCommand(input, 'about')
    expect(screen.getByText(about.name)).toBeTruthy()
    expect(promptPaths().at(-1)).toBe(':~/projects')

    fireEvent.change(input, { target: { value: 'ls ' } })
    expect(fireEvent.keyDown(input, { key: 'l', ctrlKey: true })).toBe(false)

    expect(screen.getByRole('log').textContent).toBe('')
    expect(screen.getByText('Welcome to the terminal portfolio.')).toBeTruthy()
    expect(input).toHaveProperty('value', 'ls ')
    expect(promptPaths()).toEqual([':~/projects'])
    expect(document.activeElement).toBe(input)

    runCommand(input, 'history')
    const listed = screen.getByRole('log').textContent ?? ''
    expect(listed).toContain('    1  cd projects')
    expect(listed).toContain('    2  about')
    expect(listed).not.toContain('    3 ')
    expect(listed).not.toContain('clear')
    expect(promptPaths().at(-1)).toBe(':~/projects')
  })

  it('cancels the current line with Ctrl+C without running or storing it', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    runCommand(input, 'cd projects')
    fireEvent.change(input, { target: { value: 'about extra' } })
    expect(fireEvent.keyDown(input, { key: 'c', ctrlKey: true })).toBe(false)

    expect(screen.getByText('about extra^C')).toBeTruthy()
    expect(screen.queryByText(about.name)).toBeNull()
    expect(screen.queryByText(about.introduction)).toBeNull()
    expect(input).toHaveProperty('value', '')
    expect(promptPaths()).toEqual([':~', ':~/projects', ':~/projects'])
    expect(document.activeElement).toBe(input)

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveProperty('value', 'cd projects')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveProperty('value', 'cd projects')

    runCommand(input, 'history')
    const listed = screen.getByRole('log').textContent ?? ''
    expect(listed).toContain('    1  cd projects')
    expect(listed).not.toContain('    2 ')
    expect(listed).toContain('about extra^C')
    expect(listed).not.toContain('  about extra')
    expect(listed).not.toContain(about.name)

    runCommand(input, 'pwd')
    expect(screen.getByText('~/projects')).toBeTruthy()

    runCommand(input, 'history')
    const again = screen.getByRole('log').textContent ?? ''
    expect(again).toContain('    1  cd projects')
    expect(again).toContain('    2  history')
    expect(again).toContain('    3  pwd')
    expect(again).not.toContain('    4 ')
    expect(again).not.toContain('  about extra')
  })

  it('prints ^C for an empty line and abandons a recalled command', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    expect(fireEvent.keyDown(input, { key: 'c', ctrlKey: true })).toBe(false)
    expect(screen.getByText('^C')).toBeTruthy()
    expect(input).toHaveProperty('value', '')

    runCommand(input, 'help')
    runCommand(input, 'about')
    const introductions = screen.getAllByText(about.introduction)
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveProperty('value', 'about')

    fireEvent.keyDown(input, { key: 'c', ctrlKey: true })
    expect(screen.getByText('about^C')).toBeTruthy()
    expect(screen.getAllByText(about.introduction)).toHaveLength(
      introductions.length,
    )
    expect(input).toHaveProperty('value', '')

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveProperty('value', 'about')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveProperty('value', 'help')
  })

  it('leaves copy and other modified shortcuts alone', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    runCommand(input, 'about')
    fireEvent.change(input, { target: { value: 'keep me' } })

    expect(fireEvent.keyDown(input, { key: 'c', metaKey: true })).toBe(true)
    expect(fireEvent.keyDown(input, { key: 'c', ctrlKey: true, shiftKey: true })).toBe(
      true,
    )
    expect(fireEvent.keyDown(input, { key: 'l', ctrlKey: true, altKey: true })).toBe(
      true,
    )
    expect(fireEvent.keyDown(input, { key: 'l' })).toBe(true)

    expect(input).toHaveProperty('value', 'keep me')
    expect(screen.getByText(about.name)).toBeTruthy()
    expect(screen.queryByText('keep me^C')).toBeNull()
    expect(screen.queryByText('^C')).toBeNull()
  })

  it('leaves the draft alone when Ctrl+C or Ctrl+L arrives during composition', () => {
    render(<Terminal />)
    const input = screen.getByRole('textbox', { name: 'Command' })

    runCommand(input, 'about')
    fireEvent.change(input, { target: { value: 'draft' } })
    fireEvent.keyDown(input, { key: 'l', ctrlKey: true, isComposing: true })
    fireEvent.keyDown(input, { key: 'c', ctrlKey: true, isComposing: true })

    expect(input).toHaveProperty('value', 'draft')
    expect(screen.getByText(about.name)).toBeTruthy()
    expect(screen.queryByText('draft^C')).toBeNull()
  })
})
