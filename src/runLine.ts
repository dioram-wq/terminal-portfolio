import { COMMANDS, parseCommand } from './commandParser.ts'

export type ScrollbackEntry =
  | { kind: 'echo'; line: string }
  | { kind: 'output'; line: string }

type LineEffect =
  | { kind: 'append'; entries: ScrollbackEntry[] }
  | { kind: 'clear' }

function helpOutput(): ScrollbackEntry[] {
  const width = COMMANDS.reduce(
    (longest, command) => Math.max(longest, command.name.length),
    0,
  )

  return COMMANDS.map(
    (command): ScrollbackEntry => ({
      kind: 'output',
      line: `${command.name.padEnd(width)}  ${command.description}`,
    }),
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
        return { kind: 'append', entries: [echo, ...helpOutput()] }
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
