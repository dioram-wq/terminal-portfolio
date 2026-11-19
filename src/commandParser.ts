export const COMMANDS = [
  { name: 'help', description: 'List available commands' },
  { name: 'clear', description: 'Clear the scrollback log' },
  { name: 'about', description: 'Print a short introduction' },
  { name: 'projects', description: 'List selected projects' },
  { name: 'resume', description: 'Show education and skills' },
  { name: 'ls', description: 'List directory contents' },
  { name: 'cat', description: 'Print a file' },
] as const

export const KNOWN_COMMANDS = COMMANDS.map((command) => command.name)

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
