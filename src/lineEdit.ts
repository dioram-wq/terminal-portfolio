import { returnToDraft, type CommandHistory } from './history.ts'
import type { ScrollbackEntry } from './runLine.ts'

export type KeyChord = {
  key: string
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
  shiftKey: boolean
}

export type LineEdit = { kind: 'clear-screen' } | { kind: 'cancel-line' }

export type LineEditState = {
  log: readonly ScrollbackEntry[]
  draft: string
  cwd: string
  history: CommandHistory
}

// Ctrl+L redraws a clear screen and keeps the line being edited.
// Ctrl+C aborts that line. Shift, Alt, and Meta stay free for other shortcuts.
export function lineEditFor(chord: KeyChord): LineEdit | null {
  if (!chord.ctrlKey || chord.altKey || chord.metaKey || chord.shiftKey) {
    return null
  }

  if (chord.key === 'l' || chord.key === 'L') {
    return { kind: 'clear-screen' }
  }
  if (chord.key === 'c' || chord.key === 'C') {
    return { kind: 'cancel-line' }
  }
  return null
}

export function applyLineEdit(
  state: LineEditState,
  edit: LineEdit,
): LineEditState {
  if (edit.kind === 'clear-screen') {
    if (state.log.length === 0) {
      return state
    }
    return { ...state, log: [] }
  }

  return {
    ...state,
    log: [
      ...state.log,
      { kind: 'echo', line: `${state.draft}^C`, cwd: state.cwd },
    ],
    draft: '',
    history: returnToDraft(state.history),
  }
}
