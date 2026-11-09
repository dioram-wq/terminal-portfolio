export function Terminal() {
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
          A fake shell for projects, resume, and about. Commands are not
          wired up yet.
        </p>
        <p className="terminal__prompt">
          <span className="terminal__user">visitor@portfolio</span>
          <span className="terminal__path">:~</span>
          <span className="terminal__sigil">$</span>
          <span className="terminal__cursor" aria-hidden="true" />
        </p>
      </div>
    </main>
  )
}
