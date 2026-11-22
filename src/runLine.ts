import { COMMANDS, parseCommand } from './commandParser.ts'
import {
  aboutText,
  catLines,
  changeDirectory,
  lsLines,
  projectsText,
  pwdLines,
  resumeText,
} from './filesystem.ts'

export type ScrollbackEntry =
  | { kind: 'echo'; line: string; cwd: string }
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

function effectFor(line: string, cwd: string): { effect: LineEffect; cwd: string } {
  const echo: ScrollbackEntry = { kind: 'echo', line, cwd }
  const parsed = parseCommand(line)

  switch (parsed.kind) {
    case 'empty':
      return { effect: { kind: 'append', entries: [echo] }, cwd }
    case 'unknown':
      return {
        effect: {
          kind: 'append',
          entries: [
            echo,
            { kind: 'output', line: `command not found: ${parsed.name}` },
          ],
        },
        cwd,
      }
    case 'command':
      if (parsed.name === 'clear') {
        return { effect: { kind: 'clear' }, cwd }
      }
      if (parsed.name === 'help') {
        return {
          effect: { kind: 'append', entries: [echo, ...output(helpLines())] },
          cwd,
        }
      }
      if (parsed.name === 'about') {
        return {
          effect: { kind: 'append', entries: [echo, ...output(aboutText())] },
          cwd,
        }
      }
      if (parsed.name === 'projects') {
        return {
          effect: { kind: 'append', entries: [echo, ...output(projectsText())] },
          cwd,
        }
      }
      if (parsed.name === 'resume') {
        return {
          effect: { kind: 'append', entries: [echo, ...output(resumeText())] },
          cwd,
        }
      }
      if (parsed.name === 'ls') {
        return {
          effect: {
            kind: 'append',
            entries: [echo, ...output(lsLines(parsed.args, cwd))],
          },
          cwd,
        }
      }
      if (parsed.name === 'cat') {
        return {
          effect: {
            kind: 'append',
            entries: [echo, ...output(catLines(parsed.args, cwd))],
          },
          cwd,
        }
      }
      if (parsed.name === 'cd') {
        const next = changeDirectory(cwd, parsed.args)
        return {
          effect: { kind: 'append', entries: [echo, ...output(next.lines)] },
          cwd: next.cwd,
        }
      }
      if (parsed.name === 'pwd') {
        return {
          effect: { kind: 'append', entries: [echo, ...output(pwdLines(cwd))] },
          cwd,
        }
      }
      return {
        effect: {
          kind: 'append',
          entries: [
            echo,
            { kind: 'output', line: `${parsed.name}: coming soon` },
          ],
        },
        cwd,
      }
  }
}

export function runLine(line: string, cwd = ''): ScrollbackEntry[] {
  const resolved = effectFor(line, cwd)
  return resolved.effect.kind === 'clear' ? [] : resolved.effect.entries
}

export function applyLine(
  log: readonly ScrollbackEntry[],
  line: string,
  cwd = '',
): ScrollbackEntry[] {
  const resolved = effectFor(line, cwd)
  return resolved.effect.kind === 'clear' ? [] : [...log, ...resolved.effect.entries]
}

export function cwdAfter(line: string, cwd = ''): string {
  return effectFor(line, cwd).cwd
}
