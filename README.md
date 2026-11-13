# terminal-portfolio

A terminal-style personal portfolio. The page is a fake shell: visitors type commands such as `help`, `projects`, `resume`, `about`, and `clear`.

The screen shows a welcome line and a `visitor@portfolio:~$` prompt. The prompt reads input: Enter echoes the line into a scrollback log, runs it through the command parser, and prints the result. `help` lists every command with a one-line description, and `clear` empties the log. `about` prints a short introduction, and `projects` lists selected projects with a one-line description and a GitHub link. `resume` still prints a placeholder.

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
- [x] `help` and `clear`. `help` lists every command with a one-line description, and `clear` empties the scrollback.
- [x] `about` and `projects`, backed by a local content module. `about` prints a short introduction. `projects` lists each project with a one-line description and a GitHub link.
- [ ] `resume`, still a placeholder.
- [ ] Command history with the up and down arrow keys.
- [ ] A layout that stays usable on a narrow screen, then a deploy target.
