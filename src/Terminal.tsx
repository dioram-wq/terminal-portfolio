import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { runLine, type ScrollbackEntry } from './runLine.ts'

export function Terminal() {
  const [log, setLog] = useState<ScrollbackEntry[]>([])
  const [draft, setDraft] = useState('')

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) {
      return
    }

    event.preventDefault()
    setLog((current) => [...current, ...runLine(draft)])
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
        <p className="terminal__line">Welcome to the terminal portfolio.</p>
        <p className="terminal__line terminal__line--dim">
          A fake shell for projects, resume, and about. Press Enter to run a
          line.
        </p>
        <div className="terminal__log" role="log">
          {log.map((entry, index) =>
            entry.kind === 'echo' ? (
              <Prompt key={index} logged>
                <span className="terminal__command">{entry.line}</span>
              </Prompt>
            ) : (
              <p className="terminal__line" key={index}>
                {entry.line}
              </p>
            ),
          )}
        </div>
        <Prompt>
          <input
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
    </main>
  )
}

function Prompt({
  children,
  logged = false,
}: {
  children: ReactNode
  logged?: boolean
}) {
  return (
    <div
      className={
        logged ? 'terminal__prompt terminal__prompt--logged' : 'terminal__prompt'
      }
    >
      <span className="terminal__user">visitor@portfolio</span>
      <span className="terminal__path">:~</span>
      <span className="terminal__sigil">$</span>
      {children}
    </div>
  )
}
