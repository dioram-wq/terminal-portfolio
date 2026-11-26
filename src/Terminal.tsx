import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { KNOWN_COMMANDS } from './commandParser.ts'
import { completeCommand } from './completion.ts'
import { formatCwd } from './filesystem.ts'
import {
  createHistory,
  recallNext,
  recallPrevious,
  recordCommand,
  type CommandHistory,
} from './history.ts'
import { applyLineEdit, lineEditFor } from './lineEdit.ts'
import { applyLine, cwdAfter, shellUser, type ScrollbackEntry } from './runLine.ts'

const URL_PATTERN = /https?:\/\/[^\s]+/g

function outputLine(line: string): ReactNode {
  const matches = [...line.matchAll(URL_PATTERN)]
  if (matches.length === 0) {
    return line
  }

  const nodes: ReactNode[] = []
  let cursor = 0
  for (const match of matches) {
    const url = match[0]
    const index = match.index ?? 0
    if (index > cursor) {
      nodes.push(line.slice(cursor, index))
    }
    nodes.push(
      <a
        key={`${index}:${url}`}
        className="terminal__link"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {url}
      </a>,
    )
    cursor = index + url.length
  }
  if (cursor < line.length) {
    nodes.push(line.slice(cursor))
  }
  return nodes
}

export function Terminal() {
  const [log, setLog] = useState<readonly ScrollbackEntry[]>([])
  const [draft, setDraft] = useState('')
  const [cwd, setCwd] = useState('')
  const [history, setHistory] = useState<CommandHistory>(createHistory)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const caretOffset = useRef<number | null>(null)

  useLayoutEffect(() => {
    const input = inputRef.current
    const offset = caretOffset.current
    if (!input || offset === null) {
      return
    }
    caretOffset.current = null
    input.setSelectionRange(offset, offset)
  })

  useLayoutEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) {
      return
    }
    scroller.scrollTop = log.length === 0 ? 0 : scroller.scrollHeight
  }, [log])

  function showRecalled(line: string, nextHistory: CommandHistory) {
    if (nextHistory === history && line === draft) {
      return
    }
    caretOffset.current = line.length
    setHistory(nextHistory)
    setDraft(line)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) {
      return
    }

    const edit = lineEditFor({
      key: event.key,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
    })
    if (edit) {
      event.preventDefault()
      const next = applyLineEdit({ log, draft, cwd, history }, edit)
      setLog(next.log)
      setDraft(next.draft)
      setHistory(next.history)
      return
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      const recall =
        event.key === 'ArrowUp'
          ? recallPrevious(history)
          : recallNext(history)
      showRecalled(recall.line, recall.history)
      return
    }

    if (event.key === 'Tab') {
      event.preventDefault()
      const completion = completeCommand(draft, KNOWN_COMMANDS, { cwd })
      if (completion.line !== draft) {
        caretOffset.current = completion.line.length
        setDraft(completion.line)
        return
      }
      if (completion.matches.length > 1) {
        setLog((current) => [
          ...current,
          { kind: 'output', line: completion.matches.join('  ') },
        ])
      }
      return
    }

    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    const nextCwd = cwdAfter(draft, cwd)
    const previous = history.entries
    setLog((current) => applyLine(current, draft, cwd, previous))
    setCwd(nextCwd)
    setHistory((current) => recordCommand(current, draft))
    setDraft('')
  }

  return (
    <main className="terminal" aria-label="Terminal portfolio">
      <div className="terminal__chrome">
        <span className="terminal__dot" />
        <span className="terminal__dot" />
        <span className="terminal__dot" />
        <span className="terminal__title">portfolio</span>
      </div>
      <div className="terminal__screen">
        <div className="terminal__scroll" ref={scrollRef}>
          <p className="terminal__line">Welcome to the terminal portfolio.</p>
          <p className="terminal__line terminal__line--dim">
            A fake shell for projects, resume, and about. Press Enter to run a
            line.
          </p>
          <div className="terminal__log" role="log">
            {log.map((entry, index) =>
              entry.kind === 'echo' ? (
                <Prompt key={index} logged cwd={entry.cwd}>
                  <span className="terminal__command">{entry.line}</span>
                </Prompt>
              ) : (
                <p className="terminal__line terminal__line--output" key={index}>
                  {outputLine(entry.line)}
                </p>
              ),
            )}
          </div>
          <Prompt cwd={cwd}>
            <input
              ref={inputRef}
              className="terminal__input"
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              aria-label="Command"
              autoFocus
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </Prompt>
        </div>
      </div>
    </main>
  )
}

function Prompt({
  children,
  logged = false,
  cwd = '',
}: {
  children: ReactNode
  logged?: boolean
  cwd?: string
}) {
  return (
    <div
      className={
        logged ? 'terminal__prompt terminal__prompt--logged' : 'terminal__prompt'
      }
    >
      <span className="terminal__prefix">
        <span className="terminal__user">{shellUser}@portfolio</span>
        <span className="terminal__path">:{formatCwd(cwd)}</span>
        <span className="terminal__sigil">$</span>
      </span>
      {children}
    </div>
  )
}
