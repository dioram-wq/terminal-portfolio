import { describe, expect, it } from 'vitest'
import { KNOWN_COMMANDS } from './commandParser.ts'
import { completeCommand } from './completion.ts'

describe('completeCommand', () => {
  it('completes a single match to the command name and a trailing space', () => {
    expect(completeCommand('proj')).toEqual({
      line: 'projects ',
      matches: ['projects'],
    })

    expect(completeCommand('help')).toEqual({
      line: 'help ',
      matches: ['help'],
    })

    expect(completeCommand('re', ['resume'])).toEqual({
      line: 'resume ',
      matches: ['resume'],
    })
  })

  it('completes several matches to the longest common prefix', () => {
    expect(completeCommand('he', ['help', 'hello', 'projects'])).toEqual({
      line: 'hel',
      matches: ['help', 'hello'],
    })

    expect(completeCommand('hel', ['help', 'hello'])).toEqual({
      line: 'hel',
      matches: ['help', 'hello'],
    })

    expect(completeCommand('g', ['git', 'git-status'])).toEqual({
      line: 'git',
      matches: ['git', 'git-status'],
    })
  })

  it('leaves the input unchanged when nothing matches', () => {
    expect(completeCommand('vim')).toEqual({ line: 'vim', matches: [] })
    expect(completeCommand('zzz', ['help', 'projects'])).toEqual({
      line: 'zzz',
      matches: [],
    })
  })

  it('completes an empty input to the longest prefix of every command', () => {
    expect(completeCommand('')).toEqual({
      line: '',
      matches: [...KNOWN_COMMANDS],
    })

    expect(completeCommand('', ['help', 'hello'])).toEqual({
      line: 'hel',
      matches: ['help', 'hello'],
    })
  })

  it('leaves a line that already has arguments alone', () => {
    expect(completeCommand('help extra')).toEqual({
      line: 'help extra',
      matches: [],
    })

    expect(completeCommand('projects web cli')).toEqual({
      line: 'projects web cli',
      matches: [],
    })

    expect(completeCommand('about ')).toEqual({
      line: 'about ',
      matches: [],
    })
  })
})
