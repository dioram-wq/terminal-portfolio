import { describe, expect, it } from 'vitest'
import { KNOWN_COMMANDS, parseCommand } from './commandParser.ts'

describe('parseCommand', () => {
  it('splits a line into a command name and arguments', () => {
    expect(parseCommand('projects web cli')).toEqual({
      kind: 'command',
      name: 'projects',
      args: ['web', 'cli'],
    })
  })

  it('accepts each known command', () => {
    for (const name of KNOWN_COMMANDS) {
      expect(parseCommand(name)).toEqual({
        kind: 'command',
        name,
        args: [],
      })
    }
  })

  it('reports an empty line', () => {
    expect(parseCommand('')).toEqual({ kind: 'empty' })
  })

  it('reports an unknown command', () => {
    expect(parseCommand('ls -la')).toEqual({
      kind: 'unknown',
      name: 'ls',
    })
  })
})
