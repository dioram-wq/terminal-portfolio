import { describe, expect, it } from 'vitest'
import {
  createHistory,
  recallNext,
  recallPrevious,
  recordCommand,
  returnToDraft,
} from './history.ts'

describe('command history', () => {
  it('starts on an empty draft', () => {
    const history = createHistory()

    expect(history).toEqual({ entries: [], cursor: 0 })
    expect(recallPrevious(history)).toEqual({ history, line: '' })
    expect(recallNext(history)).toEqual({ history, line: '' })
  })

  it('skips empty and whitespace-only lines', () => {
    let history = createHistory()
    history = recordCommand(history, '')
    history = recordCommand(history, '   ')
    history = recordCommand(history, '\t \n')

    expect(history).toEqual({ entries: [], cursor: 0 })
  })

  it('records submitted commands and skips a consecutive duplicate', () => {
    let history = recordCommand(createHistory(), 'help')
    history = recordCommand(history, 'help')
    history = recordCommand(history, 'about')
    history = recordCommand(history, 'about')
    history = recordCommand(history, 'help')

    expect(history).toEqual({
      entries: ['help', 'about', 'help'],
      cursor: 3,
    })
  })

  it('keeps the submitted text, including surrounding spaces', () => {
    const history = recordCommand(
      recordCommand(createHistory(), '  help'),
      'help',
    )

    expect(history.entries).toEqual(['  help', 'help'])
  })

  it('walks backward and forward, then returns to an empty draft', () => {
    let history = recordCommand(createHistory(), 'help')
    history = recordCommand(history, 'projects')
    history = recordCommand(history, 'about')

    const about = recallPrevious(history)
    const projects = recallPrevious(about.history)
    const help = recallPrevious(projects.history)
    const stillHelp = recallPrevious(help.history)

    expect(about.line).toBe('about')
    expect(projects.line).toBe('projects')
    expect(help.line).toBe('help')
    expect(stillHelp).toEqual({ history: help.history, line: 'help' })
    expect(help.history.cursor).toBe(0)

    const forwardProjects = recallNext(stillHelp.history)
    const forwardAbout = recallNext(forwardProjects.history)
    const draft = recallNext(forwardAbout.history)
    const stillDraft = recallNext(draft.history)

    expect(forwardProjects.line).toBe('projects')
    expect(forwardAbout.line).toBe('about')
    expect(draft).toEqual({
      history: { entries: ['help', 'projects', 'about'], cursor: 3 },
      line: '',
    })
    expect(stillDraft).toEqual(draft)
  })

  it('returns to the empty draft after a command is recorded while browsing', () => {
    let history = recordCommand(createHistory(), 'help')
    history = recordCommand(history, 'about')
    history = recallPrevious(recallPrevious(history).history).history

    history = recordCommand(history, 'projects')

    expect(history).toEqual({
      entries: ['help', 'about', 'projects'],
      cursor: 3,
    })
    expect(recallNext(history).line).toBe('')
  })

  it('drops a blank line submitted while browsing and returns to the draft', () => {
    let history = recordCommand(createHistory(), 'help')
    history = recallPrevious(history).history
    history = recordCommand(history, ' \t')

    expect(history).toEqual({ entries: ['help'], cursor: 1 })
    expect(recallNext(history)).toEqual({ history, line: '' })
  })

  it('returns to the empty draft after walking backward', () => {
    let history = recordCommand(createHistory(), 'help')
    history = recordCommand(history, 'about')
    history = recallPrevious(recallPrevious(history).history).history

    expect(history.cursor).toBe(0)

    const draft = returnToDraft(history)

    expect(draft).toEqual({ entries: ['help', 'about'], cursor: 2 })
    expect(returnToDraft(draft)).toBe(draft)
  })

  it('keeps a history that is already sitting on the draft', () => {
    const empty = createHistory()
    const recorded = recordCommand(empty, 'help')

    expect(returnToDraft(empty)).toBe(empty)
    expect(returnToDraft(recorded)).toBe(recorded)
  })

  it('does not add a duplicate when the newest command is submitted again', () => {
    let history = recordCommand(createHistory(), 'help')
    history = recordCommand(history, 'about')
    history = recallPrevious(history).history
    history = recordCommand(history, 'about')

    expect(history).toEqual({
      entries: ['help', 'about'],
      cursor: 2,
    })
  })
})
