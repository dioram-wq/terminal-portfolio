import { describe, expect, it } from 'vitest'
import { COMMANDS, KNOWN_COMMANDS } from './commandParser.ts'
import { about, projects } from './content.ts'
import { applyLine, runLine } from './runLine.ts'

function outputLines(line: string): string[] {
  return runLine(line)
    .filter((entry) => entry.kind === 'output')
    .map((entry) => entry.line)
}

describe('runLine', () => {
  it('echoes an empty line and prints no result', () => {
    expect(runLine('')).toEqual([{ kind: 'echo', line: '' }])
  })

  it('echoes a whitespace-only line and prints no result', () => {
    expect(runLine(' \t  \n ')).toEqual([{ kind: 'echo', line: ' \t  \n ' }])
  })

  it('reports an unknown command', () => {
    expect(runLine('ls -la')).toEqual([
      { kind: 'echo', line: 'ls -la' },
      { kind: 'output', line: 'command not found: ls' },
    ])
  })

  it('keeps the typed line when resume is given extra arguments', () => {
    const entries = runLine('  resume   web  ')
    expect(entries[0]).toEqual({ kind: 'echo', line: '  resume   web  ' })
    expect(entries.length).toBeGreaterThan(1)
    expect(entries.slice(1).every((entry) => entry.kind === 'output')).toBe(
      true,
    )
    expect(entries.map((entry) => entry.line).join('\n')).not.toContain(
      'coming soon',
    )
  })

  it('prints the about introduction from local content', () => {
    expect(runLine('about extra')[0]).toEqual({
      kind: 'echo',
      line: 'about extra',
    })
    expect(outputLines('about extra')).toEqual([
      about.name,
      about.introduction,
      about.focus,
    ])
    expect(outputLines('about extra').join('\n')).not.toContain('coming soon')
  })

  it('lists every project with its description and GitHub link', () => {
    const entries = runLine('  projects   web  ')
    const lines = entries
      .filter((entry) => entry.kind === 'output')
      .map((entry) => entry.line)
    const width = Math.max(...projects.map((project) => project.name.length))

    expect(entries[0]).toEqual({ kind: 'echo', line: '  projects   web  ' })
    expect(lines).toEqual(
      projects.flatMap((project) => [
        `${project.name.padEnd(width)}  ${project.description}`,
        `${''.padEnd(width)}  ${project.url}`,
      ]),
    )
    expect(lines.join('\n')).not.toContain('coming soon')
  })

  it('treats command names as case-sensitive', () => {
    expect(runLine('Help')).toEqual([
      { kind: 'echo', line: 'Help' },
      { kind: 'output', line: 'command not found: Help' },
    ])
  })

  it('lists every known command with its description', () => {
    const entries = runLine('help')
    const lines = entries
      .filter((entry) => entry.kind === 'output')
      .map((entry) => entry.line)

    expect(entries[0]).toEqual({ kind: 'echo', line: 'help' })
    expect(lines.map((line) => line.split(' ')[0])).toEqual(KNOWN_COMMANDS)

    for (const command of COMMANDS) {
      const line = lines.find((text) => text.startsWith(command.name))
      expect(line).toContain(command.description)
    }
  })
})

describe('applyLine', () => {
  it('empties the log on clear and still accepts the next line', () => {
    const filled = applyLine([], 'about')
    expect(filled).toEqual([
      { kind: 'echo', line: 'about' },
      { kind: 'output', line: about.name },
      { kind: 'output', line: about.introduction },
      { kind: 'output', line: about.focus },
    ])

    const cleared = applyLine(filled, '  clear  ')
    expect(cleared).toEqual([])
    expect(applyLine(cleared, 'about')).toEqual(filled)
  })
})
