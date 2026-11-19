import { COMMANDS, parseCommand } from './commandParser.ts'
import {
  aboutText,
  catLines,
  lsLines,
  projectsText,
  resumeText,
} from './filesystem.ts'

export type ScrollbackEntry =
  | { kind: 'echo'; line: string }
  | { kind: 'output'; line: string }

type LineEffect =
  | { kind: 'append'; entries: ScrollbackEntry[] }
  | { kind: 'clear' }

function output(lines: readonly string[]): ScrollbackEntry[] {
  return lines.map((line): ScrollbackEntry => ({ kind: 'output', line }))
}

function helpLines(): string[] {
  const width = COMMANDS.reduce(
    (longest, command) => Math.max(longest, command.name.length),
    0,
  )

  return COMMANDS.map(
    (command) => `${command.name.padEnd(width)}  ${command.description}`,
  )
}

function effectFor(line: string): LineEffect {
  const echo: ScrollbackEntry = { kind: 'echo', line }
  const parsed = parseCommand(line)

  switch (parsed.kind) {
    case 'empty':
      return { kind: 'append', entries: [echo] }
    case 'unknown':
      return {
        kind: 'append',
        entries: [
          echo,
          { kind: 'output', line: `command not found: ${parsed.name}` },
        ],
      }
    case 'command':
      if (parsed.name === 'clear') {
        return { kind: 'clear' }
      }
      if (parsed.name === 'help') {
        return { kind: 'append', entries: [echo, ...output(helpLines())] }
      }
      if (parsed.name === 'about') {
        return { kind: 'append', entries: [echo, ...output(aboutText())] }
      }
      if (parsed.name === 'projects') {
        return { kind: 'append', entries: [echo, ...output(projectsText())] }
      }
      if (parsed.name === 'resume') {
        return { kind: 'append', entries: [echo, ...output(resumeText())] }
      }
      if (parsed.name === 'ls') {
        return {
          kind: 'append',
          entries: [echo, ...output(lsLines(parsed.args))],
        }
      }
      if (parsed.name === 'cat') {
        return {
          kind: 'append',
          entries: [echo, ...output(catLines(parsed.args))],
        }
      }
      return {
        kind: 'append',
        entries: [
          echo,
          { kind: 'output', line: `${parsed.name}: coming soon` },
        ],
      }
  }
}

export function runLine(line: string): ScrollbackEntry[] {
  const effect = effectFor(line)
  return effect.kind === 'clear' ? [] : effect.entries
}

export function applyLine(
  log: readonly ScrollbackEntry[],
  line: string,
): ScrollbackEntry[] {
  const effect = effectFor(line)
  return effect.kind === 'clear' ? [] : [...log, ...effect.entries]
}
