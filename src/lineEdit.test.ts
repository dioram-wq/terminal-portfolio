import { describe, expect, it } from 'vitest'
import {
  createHistory,
  recallPrevious,
  recordCommand,
} from './history.ts'
import {
  applyLineEdit,
  lineEditFor,
  type KeyChord,
  type LineEditState,
} from './lineEdit.ts'

function chord(key: string, modifiers: Partial<KeyChord> = {}): KeyChord {
  return {
    key,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    shiftKey: false,
    ...modifiers,
  }
}

describe('lineEditFor', () => {
  it('maps Ctrl+L to a clear screen and Ctrl+C to cancelling the line', () => {
    expect(lineEditFor(chord('l', { ctrlKey: true }))).toEqual({
      kind: 'clear-screen',
    })
    expect(lineEditFor(chord('L', { ctrlKey: true }))).toEqual({
      kind: 'clear-screen',
    })
    expect(lineEditFor(chord('c', { ctrlKey: true }))).toEqual({
      kind: 'cancel-line',
    })
    expect(lineEditFor(chord('C', { ctrlKey: true }))).toEqual({
      kind: 'cancel-line',
    })
  })

  it('ignores plain letters and Ctrl combined with another modifier', () => {
    expect(lineEditFor(chord('l'))).toBeNull()
    expect(lineEditFor(chord('c'))).toBeNull()
    expect(lineEditFor(chord('L'))).toBeNull()
    expect(lineEditFor(chord('c', { ctrlKey: true, shiftKey: true }))).toBeNull()
    expect(lineEditFor(chord('l', { ctrlKey: true, altKey: true }))).toBeNull()
    expect(lineEditFor(chord('c', { ctrlKey: true, metaKey: true }))).toBeNull()
    expect(lineEditFor(chord('c', { metaKey: true }))).toBeNull()
    expect(lineEditFor(chord('l', { shiftKey: true }))).toBeNull()
    expect(lineEditFor(chord('Enter', { ctrlKey: true }))).toBeNull()
  })
})

describe('applyLineEdit', () => {
  function filledHistory() {
    return recordCommand(recordCommand(createHistory(), 'help'), 'about')
  }

  function filledState(): LineEditState {
    return {
      log: [
        { kind: 'echo', line: 'about', cwd: '' },
        { kind: 'output', line: 'Diogo Ramos' },
      ],
      draft: 'ls ',
      cwd: 'projects',
      history: filledHistory(),
    }
  }

  it('clears the scrollback and keeps the draft, directory, and history', () => {
    const state = filledState()
    const recalled = recallPrevious(state.history).history
    const browsing = { ...state, history: recalled }
    const next = applyLineEdit(browsing, { kind: 'clear-screen' })

    expect(next.log).toEqual([])
    expect(next.draft).toBe('ls ')
    expect(next.cwd).toBe('projects')
    expect(next.history).toBe(recalled)
    expect(next.history).toEqual({
      entries: ['help', 'about'],
      cursor: 1,
    })
  })

  it('leaves an already empty log untouched', () => {
    const state = { ...filledState(), log: [] }

    expect(applyLineEdit(state, { kind: 'clear-screen' })).toBe(state)
  })

  it('prints the draft with ^C and does not run it or store it', () => {
    const state = filledState()
    const next = applyLineEdit(
      { ...state, draft: '  about extra' },
      { kind: 'cancel-line' },
    )

    expect(next.log).toEqual([
      { kind: 'echo', line: 'about', cwd: '' },
      { kind: 'output', line: 'Diogo Ramos' },
      { kind: 'echo', line: '  about extra^C', cwd: 'projects' },
    ])
    expect(next.draft).toBe('')
    expect(next.cwd).toBe('projects')
    expect(next.history).toBe(state.history)
    expect(next.history.entries).toEqual(['help', 'about'])
  })

  it('prints ^C when the draft is empty', () => {
    const state = { ...filledState(), draft: '' }
    const next = applyLineEdit(state, { kind: 'cancel-line' })

    expect(next.log.at(-1)).toEqual({
      kind: 'echo',
      line: '^C',
      cwd: 'projects',
    })
    expect(next.draft).toBe('')
    expect(next.history).toBe(state.history)
  })

  it('abandons a recalled line so the next Up starts at the newest command', () => {
    const state = filledState()
    const recalled = recallPrevious(state.history).history
    const next = applyLineEdit(
      { ...state, draft: 'about', history: recalled },
      { kind: 'cancel-line' },
    )

    expect(next.log.at(-1)).toEqual({
      kind: 'echo',
      line: 'about^C',
      cwd: 'projects',
    })
    expect(next.draft).toBe('')
    expect(next.history.entries).toEqual(['help', 'about'])
    expect(next.history.cursor).toBe(2)
    expect(next.history).not.toBe(recalled)
  })
})
