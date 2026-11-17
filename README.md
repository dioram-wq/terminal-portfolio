# terminal-portfolio

A terminal-style personal portfolio. The page is a fake shell: visitors type commands such as `help`, `projects`, `resume`, `about`, and `clear`. It stays usable on a narrow phone screen: text wraps, and the command line remains on screen.

The screen shows a welcome line and a `visitor@portfolio:~$` prompt. The prompt reads input: Enter echoes the line into a scrollback log, runs it through the command parser, and prints the result. Up and Down recall earlier commands, and Down past the newest entry returns to an empty draft. Tab completes a command name from the same list `help` prints: one match finishes the name, and several matches fill the longest shared prefix. `help` lists every command with a one-line description, and `clear` empties the log. `about` prints a short introduction, and `projects` lists selected projects with a one-line description and a GitHub link. `resume` prints education and a short skills list.

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
- [x] `resume`, backed by the local content module. It prints education and a short skills list.
- [x] Command history with the up and down arrow keys. Up recalls older commands, and Down past the newest entry returns to an empty draft.
- [x] Tab completion for command names.
- [x] A layout that stays usable on a narrow screen. The prompt, input, and scrollback fit a phone width, long lines wrap, and the page does not scroll sideways.
- [ ] A deploy target.
