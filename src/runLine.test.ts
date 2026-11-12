import { describe, expect, it } from 'vitest'
import { COMMANDS, KNOWN_COMMANDS } from './commandParser.ts'
import { applyLine, runLine } from './runLine.ts'

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

  it('keeps the typed line and uses the parsed name', () => {
    expect(runLine('  projects   web  ')).toEqual([
      { kind: 'echo', line: '  projects   web  ' },
      { kind: 'output', line: 'projects: coming soon' },
    ])
  })

  it('prints a placeholder for commands that are not implemented yet', () => {
    for (const name of ['about', 'projects', 'resume']) {
      expect(runLine(`${name} extra`)).toEqual([
        { kind: 'echo', line: `${name} extra` },
        { kind: 'output', line: `${name}: coming soon` },
      ])
    }
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
      { kind: 'output', line: 'about: coming soon' },
    ])

    const cleared = applyLine(filled, '  clear  ')
    expect(cleared).toEqual([])
    expect(applyLine(cleared, 'resume')).toEqual([
      { kind: 'echo', line: 'resume' },
      { kind: 'output', line: 'resume: coming soon' },
    ])
  })
})
