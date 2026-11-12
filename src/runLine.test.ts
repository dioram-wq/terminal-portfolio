import { describe, expect, it } from 'vitest'
import { runLine } from './runLine.ts'

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
})
