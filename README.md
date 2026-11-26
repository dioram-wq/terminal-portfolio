# terminal-portfolio

A terminal-style personal portfolio. The page is a fake shell: visitors type commands such as `help`, `history`, `whoami`, `echo`, `projects`, `resume`, `about`, `ls`, `cat`, `cd`, `pwd`, and `clear`. It stays usable on a narrow phone screen: text wraps, and the command line remains on screen.

The screen shows a welcome line and a prompt that includes the current directory: `visitor@portfolio:~$` at the root, and `visitor@portfolio:~/projects$` inside `projects`. The prompt reads input: Enter echoes the line into a scrollback log, runs it through the command parser, and prints the result. Up and Down recall earlier commands, and Down past the newest entry returns to an empty draft. Ctrl+L clears the scrollback the same way `clear` does, and leaves the draft on the prompt. Ctrl+C cancels the current line: it prints the draft with `^C`, and it does not run the line or store it in history. `history` prints that same list, numbered from 1, with each command on its own line. Tab completes a command name from the same list `help` prints: one match finishes the name, and several matches fill the longest shared prefix. For `ls`, `cat`, and `cd`, Tab also completes the path argument against the read-only virtual filesystem, relative to the current directory. One match finishes the name (`cat ab` becomes `cat about.txt`, and `cd pro` becomes `cd projects/`), and several matches fill the longest shared prefix (`cat projects/` fills the shared prefix of the files in that directory). `cd` only completes directories. `help` lists every command with a one-line description, and `clear` empties the log without dropping command history. `about` prints a short introduction, and `projects` lists selected projects with a one-line description and a GitHub link. `resume` prints education and a short skills list. `ls` lists a read-only virtual filesystem, and `cat` prints a file. `cd` changes the current directory, and `pwd` prints it. `ls` and `cat` resolve relative paths from that directory. The root holds `about.txt`, `resume.txt`, and a `projects/` directory with one file per project, using the same text as `about`, `resume`, and `projects`. `cd` into a file or a missing path prints a shell error and leaves the directory unchanged. `whoami` prints `visitor`, the user shown in the prompt. `echo` prints its arguments joined by single spaces, and prints an empty line when it has no arguments.

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

GitHub Actions runs that build and those tests. `.github/workflows/ci.yml` runs on every push and pull request to `main`, uses Node.js 22, and runs `npm ci`, `npm run build`, and `npm test`.

## GitHub Pages

`.github/workflows/pages.yml` runs on every push to `main`. It runs the tests, builds `dist`, and deploys that folder with `actions/upload-pages-artifact` and `actions/deploy-pages`. The build sets `GITHUB_PAGES=true`, and Vite then uses `base: '/terminal-portfolio/'` so the asset URLs match a project site. Local `npm run dev`, `npm run build`, and `npm run preview` leave that variable unset and keep `base: '/'`.

Pages is not enabled on this repository yet. In the repository settings, open Pages and set Build and deployment → Source to GitHub Actions. Until that source is selected, the deploy workflow cannot publish the site.

## Roadmap

- [x] Command parser module with unit tests. Split a line into a command name and arguments, and report an empty or unknown command.
- [x] On-screen input that runs the parser and prints results into a scrollback log.
- [x] `help` and `clear`. `help` lists every command with a one-line description, and `clear` empties the scrollback.
- [x] `about` and `projects`, backed by a local content module. `about` prints a short introduction. `projects` lists each project with a one-line description and a GitHub link.
- [x] `resume`, backed by the local content module. It prints education and a short skills list.
- [x] Command history with the up and down arrow keys. Up recalls older commands, and Down past the newest entry returns to an empty draft.
- [x] Tab completion for command names.
- [x] A layout that stays usable on a narrow screen. The prompt, input, and scrollback fit a phone width, long lines wrap, and the page does not scroll sideways.
- [x] `ls` and `cat`, over a read-only virtual filesystem built from the local content module. The root holds `about.txt`, `resume.txt`, and a `projects/` directory with one file per project. `ls` lists a directory, and `cat` prints a file using the same text as `about`, `resume`, and `projects`.
- [x] `cd` and `pwd`. `cd` changes the current directory in the read-only virtual filesystem, and `pwd` prints it. The prompt shows `~` at the root and `~/projects` inside `projects`. `ls` and `cat` resolve paths relative to the current directory. `cd` into a file or a missing path prints a shell error and stays put.
- [x] Tab completion for paths. `ls`, `cat`, and `cd` complete a path argument against the virtual filesystem, relative to the current directory. One match finishes the file or directory name, and several matches fill the longest shared prefix. `cd` only completes directories.
- [x] `history`. It prints the session's previous commands, numbered like a shell, from the same list the up and down arrow keys recall. `help` lists it, and Tab completes the name. `clear` empties the scrollback and leaves that list in place.
- [x] Ctrl+L and Ctrl+C. Ctrl+L clears the scrollback the same way `clear` does, and leaves the current directory, the draft, and command history in place. Ctrl+C cancels the current input line: it prints the draft with `^C`, does not run it, and does not add it to history. A line recalled with the arrow keys is abandoned, so the next Up starts at the newest command again.
- [x] `whoami` and `echo`. `whoami` prints `visitor`, the user shown in the prompt. `echo` prints its arguments joined by single spaces, and prints an empty line when it has no arguments. `help` lists both, and Tab completes the names.
- [ ] A deploy target. CI and a GitHub Pages workflow are in the repo. Publishing still needs Pages enabled in the repository settings (Source: GitHub Actions), and no live URL has been confirmed.
