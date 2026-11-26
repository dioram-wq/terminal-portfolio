import { describe, expect, it } from 'vitest'
import { KNOWN_COMMANDS } from './commandParser.ts'
import { completeCommand } from './completion.ts'
import { projects } from './content.ts'
import type { DirectoryEntry } from './filesystem.ts'

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

  it('completes ls and cat from the shared command list', () => {
    expect(completeCommand('l')).toEqual({
      line: 'ls ',
      matches: ['ls'],
    })

    expect(completeCommand('cat')).toEqual({
      line: 'cat ',
      matches: ['cat'],
    })

    expect(completeCommand('c')).toEqual({
      line: 'c',
      matches: ['clear', 'cat', 'cd'],
    })
  })

  it('completes cd and pwd from the shared command list', () => {
    expect(completeCommand('cd')).toEqual({
      line: 'cd ',
      matches: ['cd'],
    })

    expect(completeCommand('pw')).toEqual({
      line: 'pwd ',
      matches: ['pwd'],
    })
  })

  it('completes history from the shared command list', () => {
    expect(completeCommand('hist')).toEqual({
      line: 'history ',
      matches: ['history'],
    })

    expect(completeCommand('h')).toEqual({
      line: 'h',
      matches: ['help', 'history'],
    })
  })

  it('completes whoami and echo from the shared command list', () => {
    expect(completeCommand('who')).toEqual({
      line: 'whoami ',
      matches: ['whoami'],
    })

    expect(completeCommand('ec')).toEqual({
      line: 'echo ',
      matches: ['echo'],
    })

    expect(completeCommand('echo hello')).toEqual({
      line: 'echo hello',
      matches: [],
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

const sampleEntries: readonly DirectoryEntry[] = [
  { name: 'alpha.txt', kind: 'file' },
  { name: 'alpine', kind: 'directory' },
  { name: 'altar', kind: 'directory' },
  { name: 'beta.txt', kind: 'file' },
]

function sampleDirectory(path: string): readonly DirectoryEntry[] | null {
  if (path === '.' || path === './') {
    return sampleEntries
  }
  if (path === 'docs' || path === 'docs/') {
    return [
      { name: 'glossary.txt', kind: 'file' },
      { name: 'guide.txt', kind: 'file' },
    ]
  }
  return null
}

function sortedNames(names: readonly string[]): string[] {
  return [...names].sort((left, right) => {
    if (left < right) {
      return -1
    }
    if (left > right) {
      return 1
    }
    return 0
  })
}

function sharedPrefix(names: readonly string[]): string {
  let prefix = names[0] ?? ''
  for (const name of names) {
    let index = 0
    while (
      index < prefix.length &&
      index < name.length &&
      prefix[index] === name[index]
    ) {
      index += 1
    }
    prefix = prefix.slice(0, index)
  }
  return prefix
}

describe('path completion', () => {
  it('completes a single matching file or directory', () => {
    expect(completeCommand('cat ab')).toEqual({
      line: 'cat about.txt',
      matches: ['about.txt'],
    })

    expect(completeCommand('ls ab')).toEqual({
      line: 'ls about.txt',
      matches: ['about.txt'],
    })

    expect(completeCommand('cd pro')).toEqual({
      line: 'cd projects/',
      matches: ['projects/'],
    })

    expect(completeCommand('ls  pro')).toEqual({
      line: 'ls  projects/',
      matches: ['projects/'],
    })

    expect(completeCommand('ls about.txt re')).toEqual({
      line: 'ls about.txt resume.txt',
      matches: ['resume.txt'],
    })
  })

  it('fills the longest shared prefix of several matches', () => {
    const context = { listDirectory: sampleDirectory }

    expect(completeCommand('cat a', KNOWN_COMMANDS, context)).toEqual({
      line: 'cat al',
      matches: ['alpha.txt', 'alpine/', 'altar/'],
    })

    expect(completeCommand('cat al', KNOWN_COMMANDS, context)).toEqual({
      line: 'cat al',
      matches: ['alpha.txt', 'alpine/', 'altar/'],
    })

    expect(completeCommand('cat docs/', KNOWN_COMMANDS, context)).toEqual({
      line: 'cat docs/g',
      matches: ['glossary.txt', 'guide.txt'],
    })

    expect(completeCommand('cat docs/gu', KNOWN_COMMANDS, context)).toEqual({
      line: 'cat docs/guide.txt',
      matches: ['guide.txt'],
    })

    const projectFiles = sortedNames(
      projects.map((project) => `${project.name}.txt`),
    )
    expect(completeCommand('cat projects/')).toEqual({
      line: `cat projects/${sharedPrefix(projectFiles)}`,
      matches: projectFiles,
    })

    expect(completeCommand('cat ')).toEqual({
      line: 'cat ',
      matches: ['about.txt', 'projects/', 'resume.txt'],
    })
  })

  it('completes names inside a nested directory', () => {
    const nested = projects
      .map((project) => `${project.name}.txt`)
      .filter((name) => name.startsWith('al'))
    expect(nested).toHaveLength(1)

    expect(completeCommand('cat projects/al')).toEqual({
      line: `cat projects/${nested[0]}`,
      matches: nested,
    })

    expect(completeCommand('ls ./projects/c')).toEqual({
      line: 'ls ./projects/code-racer.txt',
      matches: ['code-racer.txt'],
    })

    expect(completeCommand('cat ~/ab')).toEqual({
      line: 'cat ~/about.txt',
      matches: ['about.txt'],
    })
  })

  it('completes only directories for cd', () => {
    const context = { listDirectory: sampleDirectory }

    expect(completeCommand('cd a', KNOWN_COMMANDS, context)).toEqual({
      line: 'cd al',
      matches: ['alpine/', 'altar/'],
    })

    expect(completeCommand('cd alp', KNOWN_COMMANDS, context)).toEqual({
      line: 'cd alpine/',
      matches: ['alpine/'],
    })

    expect(completeCommand('cd b', KNOWN_COMMANDS, context)).toEqual({
      line: 'cd b',
      matches: [],
    })

    expect(completeCommand('cat b', KNOWN_COMMANDS, context)).toEqual({
      line: 'cat beta.txt',
      matches: ['beta.txt'],
    })

    expect(completeCommand('cd a')).toEqual({
      line: 'cd a',
      matches: [],
    })

    expect(completeCommand('cd ')).toEqual({
      line: 'cd projects/',
      matches: ['projects/'],
    })

    expect(completeCommand('cd projects/')).toEqual({
      line: 'cd projects/',
      matches: [],
    })

    expect(completeCommand('cat a')).toEqual({
      line: 'cat about.txt',
      matches: ['about.txt'],
    })
  })

  it('leaves the input unchanged when nothing matches', () => {
    expect(completeCommand('cat zz')).toEqual({
      line: 'cat zz',
      matches: [],
    })

    expect(completeCommand('ls missing/a')).toEqual({
      line: 'ls missing/a',
      matches: [],
    })

    expect(completeCommand('cd about.txt')).toEqual({
      line: 'cd about.txt',
      matches: [],
    })

    expect(completeCommand('cat about.txt/')).toEqual({
      line: 'cat about.txt/',
      matches: [],
    })

    expect(completeCommand('pwd about')).toEqual({
      line: 'pwd about',
      matches: [],
    })
  })

  it('completes paths relative to the current directory', () => {
    const cwd = 'projects'

    expect(completeCommand('cat c', KNOWN_COMMANDS, { cwd })).toEqual({
      line: 'cat code-racer.txt',
      matches: ['code-racer.txt'],
    })

    expect(completeCommand('cat ab', KNOWN_COMMANDS, { cwd })).toEqual({
      line: 'cat ab',
      matches: [],
    })

    expect(completeCommand('cd p', KNOWN_COMMANDS, { cwd })).toEqual({
      line: 'cd p',
      matches: [],
    })

    expect(completeCommand('cat ../ab', KNOWN_COMMANDS, { cwd })).toEqual({
      line: 'cat ../about.txt',
      matches: ['about.txt'],
    })

    expect(completeCommand('ls ../r', KNOWN_COMMANDS, { cwd })).toEqual({
      line: 'ls ../resume.txt',
      matches: ['resume.txt'],
    })

    expect(completeCommand('cd ../p', KNOWN_COMMANDS, { cwd })).toEqual({
      line: 'cd ../projects/',
      matches: ['projects/'],
    })

    expect(completeCommand('cat /re', KNOWN_COMMANDS, { cwd })).toEqual({
      line: 'cat /resume.txt',
      matches: ['resume.txt'],
    })

    expect(completeCommand('proj', KNOWN_COMMANDS, { cwd })).toEqual({
      line: 'projects ',
      matches: ['projects'],
    })
  })
})
