import { about, projects, resume, type Project } from './content.ts'

type FsFile = {
  kind: 'file'
  name: string
  lines: readonly string[]
}

type FsDirectory = {
  kind: 'directory'
  name: string
  children: readonly FsNode[]
}

type FsNode = FsFile | FsDirectory

type LookupResult =
  | { ok: true; node: FsNode }
  | { ok: false; reason: 'missing' | 'not_directory' }

const projectNameWidth = projects.reduce(
  (longest, project) => Math.max(longest, project.name.length),
  0,
)

function projectFileLines(project: Project): readonly string[] {
  return [
    `${project.name.padEnd(projectNameWidth)}  ${project.description}`,
    `${''.padEnd(projectNameWidth)}  ${project.url}`,
  ]
}

const projectEntries = projects.map((project) => ({
  project,
  lines: projectFileLines(project),
}))

const aboutFile: FsFile = {
  kind: 'file',
  name: 'about.txt',
  lines: [about.name, about.introduction, about.focus],
}

const resumeFile: FsFile = {
  kind: 'file',
  name: 'resume.txt',
  lines: resume.flatMap((section, index) => {
    const lines = [
      section.heading,
      ...section.lines.map((line) => `  ${line}`),
    ]
    return index < resume.length - 1 ? [...lines, ''] : lines
  }),
}

function byName(nodes: readonly FsNode[]): FsNode[] {
  return [...nodes].sort((left, right) => {
    if (left.name < right.name) {
      return -1
    }
    if (left.name > right.name) {
      return 1
    }
    return 0
  })
}

const root: FsDirectory = {
  kind: 'directory',
  name: '',
  children: byName([
    aboutFile,
    resumeFile,
    {
      kind: 'directory',
      name: 'projects',
      children: byName(
        projectEntries.map((entry) => ({
          kind: 'file' as const,
          name: `${entry.project.name}.txt`,
          lines: entry.lines,
        })),
      ),
    },
  ]),
}

export function aboutText(): readonly string[] {
  return aboutFile.lines
}

export function resumeText(): readonly string[] {
  return resumeFile.lines
}

export function projectsText(): readonly string[] {
  return projectEntries.flatMap((entry) => entry.lines)
}

function lookup(path: string): LookupResult {
  // The prompt's home directory is this virtual root.
  let remainder = path
  if (remainder === '~' || remainder.startsWith('~/')) {
    remainder = remainder.slice(1)
  }

  const trailingSlash = remainder.endsWith('/')
  const segments = remainder.split('/').filter((segment) => segment !== '')
  let current: FsNode = root
  const parents: FsDirectory[] = []

  for (const segment of segments) {
    if (segment === '.') {
      continue
    }

    if (segment === '..') {
      if (current.kind !== 'directory') {
        return { ok: false, reason: 'not_directory' }
      }
      current = parents.pop() ?? root
      continue
    }

    if (current.kind !== 'directory') {
      return { ok: false, reason: 'not_directory' }
    }

    const child: FsNode | undefined = current.children.find(
      (entry) => entry.name === segment,
    )
    if (!child) {
      return { ok: false, reason: 'missing' }
    }

    parents.push(current)
    current = child
  }

  if (trailingSlash && current.kind !== 'directory') {
    return { ok: false, reason: 'not_directory' }
  }

  return { ok: true, node: current }
}

function pathError(
  command: 'ls' | 'cat',
  path: string,
  reason: 'missing' | 'not_directory' | 'directory',
): string {
  if (reason === 'missing') {
    return `${command}: ${path}: No such file or directory`
  }
  if (reason === 'not_directory') {
    return `${command}: ${path}: Not a directory`
  }
  return `${command}: ${path}: Is a directory`
}

function listNames(directory: FsDirectory): string[] {
  return directory.children.map((entry) =>
    entry.kind === 'directory' ? `${entry.name}/` : entry.name,
  )
}

export function lsLines(args: readonly string[]): string[] {
  const targets = args.length === 0 ? ['.'] : args
  const blocks: string[][] = []

  for (const target of targets) {
    const found = lookup(target)
    if (!found.ok) {
      blocks.push([pathError('ls', target, found.reason)])
      continue
    }
    if (found.node.kind === 'file') {
      blocks.push([target])
      continue
    }
    const names = listNames(found.node)
    blocks.push(targets.length > 1 ? [`${target}:`, ...names] : names)
  }

  const lines: string[] = []
  for (const block of blocks) {
    if (lines.length > 0) {
      lines.push('')
    }
    lines.push(...block)
  }
  return lines
}

export function catLines(args: readonly string[]): string[] {
  if (args.length === 0) {
    return ['cat: missing operand']
  }

  const lines: string[] = []
  for (const target of args) {
    const found = lookup(target)
    if (!found.ok) {
      lines.push(pathError('cat', target, found.reason))
      continue
    }
    if (found.node.kind === 'directory') {
      lines.push(pathError('cat', target, 'directory'))
      continue
    }
    lines.push(...found.node.lines)
  }
  return lines
}
