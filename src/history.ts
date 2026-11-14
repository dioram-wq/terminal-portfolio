export type CommandHistory = {
  entries: readonly string[]
  cursor: number
}

export type HistoryRecall = {
  history: CommandHistory
  line: string
}

export function createHistory(): CommandHistory {
  return { entries: [], cursor: 0 }
}

export function recordCommand(
  history: CommandHistory,
  line: string,
): CommandHistory {
  const atDraft = history.cursor === history.entries.length
  if (line.trim() === '') {
    return atDraft
      ? history
      : { entries: history.entries, cursor: history.entries.length }
  }

  const last = history.entries[history.entries.length - 1]
  if (last === line) {
    return atDraft
      ? history
      : { entries: history.entries, cursor: history.entries.length }
  }

  const entries = [...history.entries, line]
  return { entries, cursor: entries.length }
}

export function recallPrevious(history: CommandHistory): HistoryRecall {
  if (history.cursor === 0) {
    return { history, line: history.entries[0] ?? '' }
  }

  const cursor = history.cursor - 1
  return {
    history: { entries: history.entries, cursor },
    line: history.entries[cursor] ?? '',
  }
}

export function recallNext(history: CommandHistory): HistoryRecall {
  if (history.cursor >= history.entries.length) {
    return { history, line: '' }
  }

  const cursor = history.cursor + 1
  return {
    history: { entries: history.entries, cursor },
    line: history.entries[cursor] ?? '',
  }
}
