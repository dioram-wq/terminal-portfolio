import { describe, expect, it } from 'vitest'
import { COMMANDS, KNOWN_COMMANDS } from './commandParser.ts'
import { about, projects, resume } from './content.ts'
import { applyLine, cwdAfter, runLine, shellUser } from './runLine.ts'

function outputLines(
  line: string,
  cwd = '',
  history: readonly string[] = [],
): string[] {
  return runLine(line, cwd, history)
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

describe('working directory', () => {
  const projectNames = projects.map((project) => `${project.name}.txt`).sort()

  it('prints ~ at the root', () => {
    expect(runLine('pwd')[0]).toEqual({ kind: 'echo', line: 'pwd', cwd: '' })
    expect(outputLines('pwd')).toEqual(['~'])
    expect(outputLines('  pwd  extra')).toEqual(['~'])
    expect(cwdAfter('pwd')).toBe('')
  })

  it('enters projects and resolves ls and cat from there', () => {
    expect(outputLines('cd projects')).toEqual([])
    expect(cwdAfter('cd projects')).toBe('projects')
    expect(runLine('  cd   projects  ')[0]).toEqual({
      kind: 'echo',
      line: '  cd   projects  ',
      cwd: '',
    })
    expect(cwdAfter('  cd   projects  ')).toBe('projects')

    const cwd = 'projects'
    expect(outputLines('pwd', cwd)).toEqual(['~/projects'])
    expect(runLine('pwd', cwd)[0]).toEqual({
      kind: 'echo',
      line: 'pwd',
      cwd: 'projects',
    })
    expect(outputLines('ls', cwd)).toEqual(projectNames)
    expect(outputLines('ls .', cwd)).toEqual(projectNames)
    expect(outputLines('ls ./', cwd)).toEqual(projectNames)
    expect(outputLines('ls ../', cwd)).toEqual(outputLines('ls'))
    expect(outputLines('ls ../../', cwd)).toEqual(outputLines('ls'))
    expect(outputLines('ls /', cwd)).toEqual(outputLines('ls'))
    expect(outputLines('ls ~', cwd)).toEqual(outputLines('ls'))
    expect(outputLines('ls about.txt', cwd)).toEqual([
      'ls: about.txt: No such file or directory',
    ])
    expect(outputLines('ls ../about.txt', cwd)).toEqual(['../about.txt'])

    for (const project of projects) {
      expect(outputLines(`cat ${project.name}.txt`, cwd)).toEqual(
        outputLines(`cat projects/${project.name}.txt`),
      )
    }
    expect(outputLines('cat ../about.txt', cwd)).toEqual(outputLines('about'))
    expect(outputLines('cat ./../about.txt', cwd)).toEqual(outputLines('about'))
    expect(outputLines('cat ~/resume.txt', cwd)).toEqual(outputLines('resume'))
    expect(outputLines('cat /about.txt', cwd)).toEqual(outputLines('about'))
    expect(outputLines('cat missing.txt', cwd)).toEqual([
      'cat: missing.txt: No such file or directory',
    ])
  })

  it('returns home with cd .., cd, cd ~, and an absolute root', () => {
    const cwd = 'projects'
    for (const line of ['cd ..', 'cd', 'cd ~', 'cd ~/', 'cd /', 'cd ../..']) {
      expect(cwdAfter(line, cwd)).toBe('')
      expect(outputLines(line, cwd)).toEqual([])
    }
    expect(outputLines('pwd', cwdAfter('cd ..', cwd))).toEqual(['~'])
  })

  it('stays at the root when cd moves above it', () => {
    expect(cwdAfter('cd ..')).toBe('')
    expect(outputLines('cd ..')).toEqual([])
    expect(outputLines('pwd', cwdAfter('cd ..'))).toEqual(['~'])
    expect(outputLines('ls', cwdAfter('cd ../..'))).toEqual(outputLines('ls'))
  })

  it('canonicalizes dotted, home, and absolute paths', () => {
    expect(cwdAfter('cd /projects')).toBe('projects')
    expect(cwdAfter('cd ~/projects')).toBe('projects')
    expect(cwdAfter('cd ./projects')).toBe('projects')
    expect(cwdAfter('cd projects/')).toBe('projects')
    expect(cwdAfter('cd projects/.')).toBe('projects')
    expect(cwdAfter('cd ./projects/../projects')).toBe('projects')
    expect(cwdAfter('cd ../projects', 'projects')).toBe('projects')
    expect(cwdAfter('cd .', 'projects')).toBe('projects')
    expect(outputLines('pwd', cwdAfter('cd /projects'))).toEqual([
      '~/projects',
    ])
  })

  it('prints a shell error and stays put for a file or a missing path', () => {
    expect(outputLines('cd nope')).toEqual([
      'cd: nope: No such file or directory',
    ])
    expect(cwdAfter('cd nope')).toBe('')
    expect(outputLines('cd about.txt')).toEqual([
      'cd: about.txt: Not a directory',
    ])
    expect(cwdAfter('cd about.txt')).toBe('')
    expect(outputLines('cd about.txt/')).toEqual([
      'cd: about.txt/: Not a directory',
    ])
    expect(outputLines('cd about.txt/extra')).toEqual([
      'cd: about.txt/extra: Not a directory',
    ])
    expect(outputLines('cd missing.txt', 'projects')).toEqual([
      'cd: missing.txt: No such file or directory',
    ])
    expect(cwdAfter('cd missing.txt', 'projects')).toBe('projects')
    expect(outputLines('cd ../about.txt', 'projects')).toEqual([
      'cd: ../about.txt: Not a directory',
    ])
    expect(cwdAfter('cd ../about.txt', 'projects')).toBe('projects')
    expect(outputLines('cd projects extra')).toEqual(['cd: too many arguments'])
    expect(cwdAfter('cd projects extra')).toBe('')
    expect(cwdAfter('cd .. extra', 'projects')).toBe('projects')
  })

  it('keeps the directory across other commands and records it on each echo', () => {
    let cwd = ''
    let log = applyLine([], 'cd projects', cwd)
    cwd = cwdAfter('cd projects', cwd)
    log = applyLine(log, 'pwd', cwd)
    cwd = cwdAfter('pwd', cwd)

    expect(cwd).toBe('projects')
    expect(log).toEqual([
      { kind: 'echo', line: 'cd projects', cwd: '' },
      { kind: 'echo', line: 'pwd', cwd: 'projects' },
      { kind: 'output', line: '~/projects' },
    ])
    expect(cwdAfter('ls', cwd)).toBe('projects')
    expect(cwdAfter('cat missing.txt', cwd)).toBe('projects')
    expect(cwdAfter('help', cwd)).toBe('projects')
    expect(cwdAfter('clear', cwd)).toBe('projects')
    expect(applyLine(log, 'clear', cwd)).toEqual([])
    expect(cwdAfter('cd nope', cwd)).toBe('projects')
  })

  it('lists cd and pwd in help and keeps their names case-sensitive', () => {
    const width = Math.max(...COMMANDS.map((command) => command.name.length))
    const lines = outputLines('help')

    for (const name of ['cd', 'pwd']) {
      const command = COMMANDS.find((entry) => entry.name === name)
      expect(lines).toContain(`${name.padEnd(width)}  ${command?.description}`)
    }

    expect(outputLines('CD')).toEqual(['command not found: CD'])
    expect(outputLines('PWD')).toEqual(['command not found: PWD'])
    expect(cwdAfter('CD')).toBe('')
  })
})

describe('history', () => {
  const session = [
    'help',
    'about',
    'ls',
    'cat about.txt',
    'cd projects',
    'pwd',
    'clear',
    'projects',
    'resume',
    '  history',
  ]

  it('prints previous commands numbered like a shell', () => {
    const entries = runLine('history', 'projects', session)

    expect(entries[0]).toEqual({
      kind: 'echo',
      line: 'history',
      cwd: 'projects',
    })
    expect(outputLines('history', 'projects', session)).toEqual([
      '    1  help',
      '    2  about',
      '    3  ls',
      '    4  cat about.txt',
      '    5  cd projects',
      '    6  pwd',
      '    7  clear',
      '    8  projects',
      '    9  resume',
      '   10    history',
    ])
    expect(outputLines('  history   extra  ', '', ['pwd'])).toEqual([
      '    1  pwd',
    ])
    expect(runLine('  history   extra  ', '', ['pwd'])[0]).toEqual({
      kind: 'echo',
      line: '  history   extra  ',
      cwd: '',
    })
    expect(cwdAfter('history', 'projects')).toBe('projects')
    expect(outputLines('History')).toEqual(['command not found: History'])
  })

  it('prints no numbered lines when the session history is empty', () => {
    expect(runLine('history')).toEqual([
      { kind: 'echo', line: 'history', cwd: '' },
    ])
    expect(outputLines('history', '', [])).toEqual([])
  })

  it('lists history in help and still prints the session after clear', () => {
    const command = COMMANDS.find((entry) => entry.name === 'history')
    const width = Math.max(...COMMANDS.map((entry) => entry.name.length))

    expect(command?.description).toBe('Print previous commands')
    expect(outputLines('help')).toContain(
      `${'history'.padEnd(width)}  ${command?.description}`,
    )

    const filled = applyLine([], 'help', '', [])
    expect(filled.some((entry) => entry.kind === 'output')).toBe(true)

    const cleared = applyLine(filled, 'clear', 'projects', ['help'])
    expect(cleared).toEqual([])

    const shown = applyLine(cleared, 'history', 'projects', ['help', 'clear'])
    expect(shown).toEqual([
      { kind: 'echo', line: 'history', cwd: 'projects' },
      { kind: 'output', line: '    1  help' },
      { kind: 'output', line: '    2  clear' },
    ])
    expect(cwdAfter('clear', 'projects')).toBe('projects')
  })
})

describe('whoami and echo', () => {
  it('prints the prompt user and ignores extra arguments', () => {
    expect(shellUser).toBe('visitor')
    expect(runLine('whoami')[0]).toEqual({
      kind: 'echo',
      line: 'whoami',
      cwd: '',
    })
    expect(outputLines('whoami')).toEqual(['visitor'])
    expect(outputLines('  whoami   extra  ')).toEqual(['visitor'])
    expect(runLine('  whoami   extra  ')[0]).toEqual({
      kind: 'echo',
      line: '  whoami   extra  ',
      cwd: '',
    })
    expect(outputLines('whoami', 'projects')).toEqual(['visitor'])
    expect(cwdAfter('whoami', 'projects')).toBe('projects')
    expect(outputLines('Whoami')).toEqual(['command not found: Whoami'])
    expect(outputLines('whoami').join('\n')).not.toContain('coming soon')
  })

  it('prints arguments joined by single spaces', () => {
    expect(runLine('echo hello world')[0]).toEqual({
      kind: 'echo',
      line: 'echo hello world',
      cwd: '',
    })
    expect(outputLines('echo hello')).toEqual(['hello'])
    expect(outputLines('echo hello world')).toEqual(['hello world'])
    expect(outputLines('  echo   hello    world  ')).toEqual(['hello world'])
    expect(runLine('  echo   hello    world  ')[0]).toEqual({
      kind: 'echo',
      line: '  echo   hello    world  ',
      cwd: '',
    })
    expect(outputLines('echo help')).toEqual(['help'])
    expect(outputLines('echo whoami')).toEqual(['whoami'])
    expect(cwdAfter('echo hello', 'projects')).toBe('projects')
    expect(outputLines('ECHO hi')).toEqual(['command not found: ECHO'])
    expect(outputLines('echo hello world').join('\n')).not.toContain(
      'coming soon',
    )
  })

  it('prints an empty line when echo has no arguments', () => {
    expect(runLine('echo')).toEqual([
      { kind: 'echo', line: 'echo', cwd: '' },
      { kind: 'output', line: '' },
    ])
    expect(outputLines('echo')).toEqual([''])
    expect(outputLines('   echo   ')).toEqual([''])
    expect(runLine('   echo   ')[0]).toEqual({
      kind: 'echo',
      line: '   echo   ',
      cwd: '',
    })
  })

  it('lists whoami and echo in help', () => {
    const width = Math.max(...COMMANDS.map((command) => command.name.length))
    const lines = outputLines('help')

    expect(COMMANDS.find((command) => command.name === 'whoami')?.description).toBe(
      'Print the current user',
    )
    expect(COMMANDS.find((command) => command.name === 'echo')?.description).toBe(
      'Print the arguments',
    )

    for (const name of ['whoami', 'echo'] as const) {
      const command = COMMANDS.find((entry) => entry.name === name)
      expect(lines).toContain(`${name.padEnd(width)}  ${command?.description}`)
    }
  })
})
