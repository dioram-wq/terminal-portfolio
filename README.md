# terminal-portfolio

A terminal-style personal portfolio. The page is a fake shell: visitors type commands such as `help`, `projects`, `resume`, `about`, and `clear`.

The screen shows a welcome line and a `visitor@portfolio:~$` prompt. The prompt reads input: Enter echoes the line into a scrollback log, runs it through the command parser, and prints the result.

Built with AI pair programming (Cursor agents) under Diogo's direction.

## Prerequisites

Node.js 22 or newer.

## Scripts

```bash
npm install
npm run dev      # local dev server
npm run build    # typecheck and production build
npm test         # unit tests
npm run preview  # serve the production build
```

## Roadmap

- [x] Command parser module with unit tests. Split a line into a command name and arguments, and report an empty or unknown command.
- [x] On-screen input that runs the parser and prints results into a scrollback log.
- [ ] `help` and `clear`.
- [ ] `about`, `projects`, and `resume`, backed by local content.
- [ ] Command history with the up and down arrow keys.
- [ ] A layout that stays usable on a narrow screen, then a deploy target.
