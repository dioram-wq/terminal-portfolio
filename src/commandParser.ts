export const KNOWN_COMMANDS = [
  'help',
  'clear',
  'about',
  'projects',
  'resume',
] as const

export type ParseResult =
  | { kind: 'command'; name: string; args: string[] }
  | { kind: 'empty' }
  | { kind: 'unknown'; name: string }

export function parseCommand(
  line: string,
  knownCommands: readonly string[] = KNOWN_COMMANDS,
): ParseResult {
  const normalized = line.trim().replace(/\s+/g, ' ')
  if (normalized === '') {
    return { kind: 'empty' }
  }

  const [name, ...args] = normalized.split(' ')
  if (!knownCommands.includes(name)) {
    return { kind: 'unknown', name }
  }

  return { kind: 'command', name, args }
}
