import { KNOWN_COMMANDS } from './commandParser.ts'

export type CommandCompletion = {
  line: string
  matches: readonly string[]
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

export function completeCommand(
  line: string,
  commands: readonly string[] = KNOWN_COMMANDS,
): CommandCompletion {
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
