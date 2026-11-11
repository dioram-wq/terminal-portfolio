import { parseCommand } from './commandParser.ts'

export type ScrollbackEntry =
  | { kind: 'echo'; line: string }
  | { kind: 'output'; line: string }

export function runLine(line: string): ScrollbackEntry[] {
  const echo: ScrollbackEntry = { kind: 'echo', line }
  const parsed = parseCommand(line)

  switch (parsed.kind) {
    case 'empty':
      return [echo]
    case 'unknown':
      return [echo, { kind: 'output', line: `command not found: ${parsed.name}` }]
    case 'command':
      return [echo, { kind: 'output', line: `${parsed.name}: coming soon` }]
  }
}
