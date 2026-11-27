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
import { formatHistory } from './history.ts'
import { DEFAULT_THEME, themeCommand, type ThemeName } from './theme.ts'

// The prompt shows this name, as in visitor@portfolio.
export const shellUser = 'visitor'

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

function effectFor(
  line: string,
  cwd: string,
  history: readonly string[],
  theme: ThemeName,
): { effect: LineEffect; cwd: string; theme: ThemeName } {
  const echo: ScrollbackEntry = { kind: 'echo', line, cwd }
  const parsed = parseCommand(line)

  switch (parsed.kind) {
    case 'empty':
      return { effect: { kind: 'append', entries: [echo] }, cwd, theme }
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
        theme,
      }
    case 'command':
      if (parsed.name === 'clear') {
        return { effect: { kind: 'clear' }, cwd, theme }
      }
      if (parsed.name === 'help') {
        return {
          effect: { kind: 'append', entries: [echo, ...output(helpLines())] },
          cwd,
          theme,
        }
      }
      if (parsed.name === 'about') {
        return {
          effect: { kind: 'append', entries: [echo, ...output(aboutText())] },
          cwd,
          theme,
        }
      }
      if (parsed.name === 'projects') {
        return {
          effect: { kind: 'append', entries: [echo, ...output(projectsText())] },
          cwd,
          theme,
        }
      }
      if (parsed.name === 'resume') {
        return {
          effect: { kind: 'append', entries: [echo, ...output(resumeText())] },
          cwd,
          theme,
        }
      }
      if (parsed.name === 'ls') {
        return {
          effect: {
            kind: 'append',
            entries: [echo, ...output(lsLines(parsed.args, cwd))],
          },
          cwd,
          theme,
        }
      }
      if (parsed.name === 'cat') {
        return {
          effect: {
            kind: 'append',
            entries: [echo, ...output(catLines(parsed.args, cwd))],
          },
          cwd,
          theme,
        }
      }
      if (parsed.name === 'cd') {
        const next = changeDirectory(cwd, parsed.args)
        return {
          effect: { kind: 'append', entries: [echo, ...output(next.lines)] },
          cwd: next.cwd,
          theme,
        }
      }
      if (parsed.name === 'pwd') {
        return {
          effect: { kind: 'append', entries: [echo, ...output(pwdLines(cwd))] },
          cwd,
          theme,
        }
      }
      if (parsed.name === 'history') {
        return {
          effect: {
            kind: 'append',
            entries: [echo, ...output(formatHistory(history))],
          },
          cwd,
          theme,
        }
      }
      if (parsed.name === 'whoami') {
        return {
          effect: {
            kind: 'append',
            entries: [echo, ...output([shellUser])],
          },
          cwd,
          theme,
        }
      }
      if (parsed.name === 'echo') {
        return {
          effect: {
            kind: 'append',
            entries: [echo, ...output([parsed.args.join(' ')])],
          },
          cwd,
          theme,
        }
      }
      if (parsed.name === 'theme') {
        const next = themeCommand(parsed.args, theme)
        return {
          effect: { kind: 'append', entries: [echo, ...output(next.lines)] },
          cwd,
          theme: next.theme,
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
        theme,
      }
  }
}

export function runLine(
  line: string,
  cwd = '',
  history: readonly string[] = [],
  theme: ThemeName = DEFAULT_THEME,
): ScrollbackEntry[] {
  const resolved = effectFor(line, cwd, history, theme)
  return resolved.effect.kind === 'clear' ? [] : resolved.effect.entries
}

export function applyLine(
  log: readonly ScrollbackEntry[],
  line: string,
  cwd = '',
  history: readonly string[] = [],
  theme: ThemeName = DEFAULT_THEME,
): ScrollbackEntry[] {
  const resolved = effectFor(line, cwd, history, theme)
  return resolved.effect.kind === 'clear'
    ? []
    : [...log, ...resolved.effect.entries]
}

export function cwdAfter(line: string, cwd = ''): string {
  return effectFor(line, cwd, [], DEFAULT_THEME).cwd
}

export function themeAfter(
  line: string,
  theme: ThemeName = DEFAULT_THEME,
): ThemeName {
  return effectFor(line, '', [], theme).theme
}

export function themeToStore(
  line: string,
  theme: ThemeName = DEFAULT_THEME,
): ThemeName | null {
  const parsed = parseCommand(line)
  if (parsed.kind !== 'command' || parsed.name !== 'theme') {
    return null
  }

  const next = themeCommand(parsed.args, theme)
  return next.persist ? next.theme : null
}
