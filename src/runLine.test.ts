import { describe, expect, it } from 'vitest'
import { COMMANDS, KNOWN_COMMANDS } from './commandParser.ts'
import { about, projects, resume } from './content.ts'
import { applyLine, runLine } from './runLine.ts'

function outputLines(line: string): string[] {
  return runLine(line)
    .filter((entry) => entry.kind === 'output')
    .map((entry) => entry.line)
}

describe('runLine', () => {
  it('echoes an empty line and prints no result', () => {
    expect(runLine('')).toEqual([{ kind: 'echo', line: '', cwd: '' }])
  })

  it('echoes a whitespace-only line and prints no result', () => {
    expect(runLine(' \t  \n ')).toEqual([
      { kind: 'echo', line: ' \t  \n ', cwd: '' },
    ])
  })

  it('reports an unknown command', () => {
    expect(runLine('vim -la')).toEqual([
      { kind: 'echo', line: 'vim -la', cwd: '' },
      { kind: 'output', line: 'command not found: vim' },
    ])
  })

  it('keeps the typed line when resume is given extra arguments', () => {
    const entries = runLine('  resume   web  ')
    expect(entries[0]).toEqual({ kind: 'echo', line: '  resume   web  ', cwd: '' })
    expect(entries.length).toBeGreaterThan(1)
    expect(entries.slice(1).every((entry) => entry.kind === 'output')).toBe(
      true,
    )
    expect(entries.map((entry) => entry.line).join('\n')).not.toContain(
      'coming soon',
    )
  })

  it('prints the about introduction from local content', () => {
    expect(runLine('about extra')[0]).toEqual({
      kind: 'echo',
      line: 'about extra',
      cwd: '',
    })
    expect(outputLines('about extra')).toEqual([
      about.name,
      about.introduction,
      about.focus,
    ])
    expect(outputLines('about extra').join('\n')).not.toContain('coming soon')
  })

  it('lists every project with its description and GitHub link', () => {
    const entries = runLine('  projects   web  ')
    const lines = entries
      .filter((entry) => entry.kind === 'output')
      .map((entry) => entry.line)
    const width = Math.max(...projects.map((project) => project.name.length))

    expect(entries[0]).toEqual({
      kind: 'echo',
      line: '  projects   web  ',
      cwd: '',
    })
    expect(lines).toEqual(
      projects.flatMap((project) => [
        `${project.name.padEnd(width)}  ${project.description}`,
        `${''.padEnd(width)}  ${project.url}`,
      ]),
    )
    expect(lines.join('\n')).not.toContain('coming soon')
  })

  it('prints education and skills from local content', () => {
    const entries = runLine('resume')
    const lines = outputLines('resume')
    const fromContent = resume.flatMap((section, index) => {
      const block = [
        section.heading,
        ...section.lines.map((line) => `  ${line}`),
      ]
      return index < resume.length - 1 ? [...block, ''] : block
    })

    expect(entries[0]).toEqual({ kind: 'echo', line: 'resume', cwd: '' })
    expect(lines).toEqual(fromContent)
    expect(lines).toEqual([
      'Education',
      '  Toronto Metropolitan University (TMU), Computer Science',
      '  Lighthouse Labs, full-stack web development diploma',
      '',
      'Skills',
      '  JavaScript, TypeScript, and React',
      '  HTML and CSS',
    ])
    expect(lines.some((line) => line.trim() === 'Experience')).toBe(false)
    expect(lines.join('\n')).not.toMatch(/Best Buy|Geek Squad|hardware/i)
    expect(lines.join('\n')).not.toContain('coming soon')
    expect(lines.join('\n')).not.toMatch(/\bGPA\b/i)
    expect(lines.join('\n')).not.toMatch(/\b(?:19|20)\d{2}\b/)
  })

  it('prints the same resume when extra arguments are given', () => {
    expect(outputLines('resume extra')).toEqual(outputLines('resume'))
    expect(runLine('resume extra')[0]).toEqual({
      kind: 'echo',
      line: 'resume extra',
      cwd: '',
    })
  })

  it('indents resume details so long lines can wrap', () => {
    const headings = new Set(resume.map((section) => section.heading))

    for (const line of outputLines('resume')) {
      if (line === '' || headings.has(line)) {
        expect(line).not.toMatch(/^\s/)
        continue
      }
      expect(line.startsWith('  ')).toBe(true)
      expect(line.slice(2)).not.toMatch(/^\s/)
      expect(line.slice(2)).not.toMatch(/\S{24,}/)
    }
  })

  it('lists resume in help with its description', () => {
    const resumeCommand = COMMANDS.find((command) => command.name === 'resume')
    const width = Math.max(...COMMANDS.map((command) => command.name.length))

    expect(resumeCommand?.description).toBe('Show education and skills')
    expect(outputLines('help')).toContain(
      `${'resume'.padEnd(width)}  ${resumeCommand?.description}`,
    )
  })

  it('treats command names as case-sensitive', () => {
    expect(runLine('Help')).toEqual([
      { kind: 'echo', line: 'Help', cwd: '' },
      { kind: 'output', line: 'command not found: Help' },
    ])
  })

  it('lists the virtual root and one file per project', () => {
    expect(runLine('ls')[0]).toEqual({ kind: 'echo', line: 'ls', cwd: '' })
    expect(outputLines('ls')).toEqual([
      'about.txt',
      'projects/',
      'resume.txt',
    ])
    expect(outputLines('ls .')).toEqual(outputLines('ls'))
    expect(outputLines('ls /')).toEqual(outputLines('ls'))
    expect(outputLines('ls ~')).toEqual(outputLines('ls'))
    expect(outputLines('ls projects/..')).toEqual(outputLines('ls'))

    const names = projects.map((project) => `${project.name}.txt`).sort()
    expect(outputLines('ls projects')).toEqual(names)
    expect(outputLines('ls projects/')).toEqual(names)
    expect(outputLines('ls ./projects')).toEqual(names)
  })

  it('prints a file path and reports paths ls cannot use', () => {
    expect(outputLines('ls about.txt')).toEqual(['about.txt'])
    expect(outputLines('ls /resume.txt')).toEqual(['/resume.txt'])
    expect(outputLines('ls nope')).toEqual([
      'ls: nope: No such file or directory',
    ])
    expect(outputLines('ls about.txt/extra')).toEqual([
      'ls: about.txt/extra: Not a directory',
    ])
    expect(outputLines('ls projects about.txt nope')).toEqual([
      'projects:',
      ...projects.map((project) => `${project.name}.txt`).sort(),
      '',
      'about.txt',
      '',
      'ls: nope: No such file or directory',
    ])
  })

  it('prints the same text as about, resume, and projects', () => {
    expect(runLine('cat   about.txt')[0]).toEqual({
      kind: 'echo',
      line: 'cat   about.txt',
      cwd: '',
    })
    expect(outputLines('cat about.txt')).toEqual(outputLines('about'))
    expect(outputLines('cat ~/resume.txt')).toEqual(outputLines('resume'))
    expect(outputLines('cat projects/../about.txt')).toEqual(
      outputLines('about'),
    )
    expect(outputLines('cat about.txt resume.txt')).toEqual([
      ...outputLines('about'),
      ...outputLines('resume'),
    ])

    const listed = outputLines('projects')
    for (const project of projects) {
      const lines = outputLines(`cat projects/${project.name}.txt`)
      const start = listed.indexOf(lines[0])
      expect(lines).toHaveLength(2)
      expect(listed.slice(start, start + 2)).toEqual(lines)
      expect(lines[0]).toContain(project.description)
      expect(lines[1].trim()).toBe(project.url)
    }
  })

  it('reports a missing cat operand, a missing file, and a directory', () => {
    expect(outputLines('cat')).toEqual(['cat: missing operand'])
    expect(outputLines('cat foo')).toEqual([
      'cat: foo: No such file or directory',
    ])
    expect(outputLines('cat projects')).toEqual([
      'cat: projects: Is a directory',
    ])
    expect(outputLines('cat projects/')).toEqual([
      'cat: projects/: Is a directory',
    ])
    expect(outputLines('cat about.txt/')).toEqual([
      'cat: about.txt/: Not a directory',
    ])
    expect(outputLines('cat foo about.txt')).toEqual([
      'cat: foo: No such file or directory',
      ...outputLines('about'),
    ])
  })

  it('lists ls and cat in help and keeps their names case-sensitive', () => {
    const width = Math.max(...COMMANDS.map((command) => command.name.length))
    const lines = outputLines('help')

    for (const name of ['ls', 'cat']) {
      const command = COMMANDS.find((entry) => entry.name === name)
      expect(lines).toContain(`${name.padEnd(width)}  ${command?.description}`)
    }

    expect(outputLines('LS')).toEqual(['command not found: LS'])
    expect(outputLines('CAT')).toEqual(['command not found: CAT'])
  })

  it('lists every known command with its description', () => {
    const entries = runLine('help')
    const lines = entries
      .filter((entry) => entry.kind === 'output')
      .map((entry) => entry.line)

    expect(entries[0]).toEqual({ kind: 'echo', line: 'help', cwd: '' })
    expect(lines.map((line) => line.split(' ')[0])).toEqual(KNOWN_COMMANDS)

    for (const command of COMMANDS) {
      const line = lines.find((text) => text.startsWith(command.name))
      expect(line).toContain(command.description)
    }
  })
})

describe('applyLine', () => {
  it('empties the log on clear and still accepts the next line', () => {
    const filled = applyLine([], 'about')
    expect(filled).toEqual([
      { kind: 'echo', line: 'about', cwd: '' },
      { kind: 'output', line: about.name },
      { kind: 'output', line: about.introduction },
      { kind: 'output', line: about.focus },
    ])

    const cleared = applyLine(filled, '  clear  ')
    expect(cleared).toEqual([])
    expect(applyLine(cleared, 'about')).toEqual(filled)
  })
})
