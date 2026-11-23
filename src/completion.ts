import { KNOWN_COMMANDS } from './commandParser.ts'
import { readDirectory, type DirectoryEntry } from './filesystem.ts'

export type CommandCompletion = {
  line: string
  matches: readonly string[]
}

export type CompletionContext = {
  cwd?: string
  listDirectory?: (
    path: string,
    cwd: string,
  ) => readonly DirectoryEntry[] | null
}

const PATH_COMMANDS = ['ls', 'cat', 'cd'] as const

type PathCommand = (typeof PATH_COMMANDS)[number]

type PathArgument = {
  command: PathCommand
  head: string
  token: string
}

function isPathCommand(name: string): name is PathCommand {
  return PATH_COMMANDS.some((command) => command === name)
}

function longestCommonPrefix(names: readonly string[]): string {
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
    if (prefix === '') {
      break
    }
  }
  return prefix
}

function pathArgument(line: string): PathArgument | null {
  const match = /^(ls|cat|cd)(\s+)([\s\S]*)$/.exec(line)
  if (!match) {
    return null
  }

  const command = match[1] ?? ''
  if (!isPathCommand(command)) {
    return null
  }

  const args = match[3] ?? ''
  let index = args.length
  while (index > 0 && !/\s/.test(args[index - 1] ?? '')) {
    index -= 1
  }

  return {
    command,
    head: `${command}${match[2] ?? ''}${args.slice(0, index)}`,
    token: args.slice(index),
  }
}

function completePath(
  line: string,
  path: PathArgument,
  context: CompletionContext,
): CommandCompletion {
  const cwd = context.cwd ?? ''
  const listDirectory = context.listDirectory ?? readDirectory
  const slash = path.token.lastIndexOf('/')
  // A token with no slash is completed in the current directory. The inserted
  // name stays relative, without a leading "./".
  const directory = slash === -1 ? '.' : path.token.slice(0, slash + 1)
  const partial = slash === -1 ? path.token : path.token.slice(slash + 1)
  const entries = listDirectory(directory, cwd)
  if (!entries) {
    return { line, matches: [] }
  }

  const matches = entries
    .filter((entry) => entry.name.startsWith(partial))
    .filter((entry) => path.command !== 'cd' || entry.kind === 'directory')
    .map((entry) =>
      entry.kind === 'directory' ? `${entry.name}/` : entry.name,
    )

  if (matches.length === 0) {
    return { line, matches: [] }
  }

  const stem = directory === '.' ? '' : directory
  const completed =
    matches.length === 1 ? matches[0] : longestCommonPrefix(matches)
  return { line: `${path.head}${stem}${completed}`, matches }
}

export function completeCommand(
  line: string,
  commands: readonly string[] = KNOWN_COMMANDS,
  context: CompletionContext = {},
): CommandCompletion {
  const path = pathArgument(line)
  if (path) {
    return completePath(line, path, context)
  }

  if (/\s/.test(line)) {
    return { line, matches: [] }
  }

  const matches = commands.filter((name) => name.startsWith(line))
  if (matches.length === 0) {
    return { line, matches: [] }
  }
  if (matches.length === 1) {
    return { line: `${matches[0]} `, matches }
  }

  return { line: longestCommonPrefix(matches), matches }
}
