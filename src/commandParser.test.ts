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

  it('trims surrounding whitespace and collapses repeated spaces', () => {
    expect(parseCommand('   resume   pdf    2024   ')).toEqual({
      kind: 'command',
      name: 'resume',
      args: ['pdf', '2024'],
    })
  })

  it('treats tabs and mixed whitespace as separators', () => {
    expect(parseCommand('\tabout\t\t  diogo\n')).toEqual({
      kind: 'command',
      name: 'about',
      args: ['diogo'],
    })
  })

  it('reports a whitespace-only line as empty', () => {
    expect(parseCommand(' \t  \n ')).toEqual({ kind: 'empty' })
  })

  it('trims the name of an unknown command', () => {
    expect(parseCommand('  helper  ')).toEqual({
      kind: 'unknown',
      name: 'helper',
    })
  })

  it('treats command names as case-sensitive', () => {
    expect(parseCommand('Help')).toEqual({
      kind: 'unknown',
      name: 'Help',
    })
  })

  it('uses the provided list of known commands', () => {
    expect(parseCommand('theme dark', ['theme'])).toEqual({
      kind: 'command',
      name: 'theme',
      args: ['dark'],
    })
    expect(parseCommand('help', ['theme'])).toEqual({
      kind: 'unknown',
      name: 'help',
    })
  })

  it('keeps a later token as an argument when it matches a command name', () => {
    expect(parseCommand('about projects')).toEqual({
      kind: 'command',
      name: 'about',
      args: ['projects'],
    })
  })
})
