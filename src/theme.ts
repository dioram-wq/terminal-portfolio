export const THEMES = ['green', 'amber', 'mono'] as const

export type ThemeName = (typeof THEMES)[number]

export const DEFAULT_THEME: ThemeName = 'green'

export const THEME_STORAGE_KEY = 'terminal-portfolio.theme'

export type ThemeStorage = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type ThemeResult = {
  lines: readonly string[]
  theme: ThemeName
  persist: boolean
}

function isThemeName(name: string): name is ThemeName {
  return THEMES.some((theme) => theme === name)
}

function listLines(current: ThemeName): string[] {
  const width = THEMES.reduce(
    (longest, name) => Math.max(longest, name.length),
    0,
  )

  return THEMES.map((name) =>
    name === current ? `${name.padEnd(width)}  current` : name,
  )
}

export function themeCommand(
  args: readonly string[],
  current: ThemeName,
): ThemeResult {
  if (args.length === 0) {
    return { lines: listLines(current), theme: current, persist: false }
  }

  if (args.length > 1) {
    return {
      lines: ['theme: too many arguments'],
      theme: current,
      persist: false,
    }
  }

  const name = args[0] ?? ''
  if (!isThemeName(name)) {
    return {
      lines: [`theme: ${name}: No such theme`],
      theme: current,
      persist: false,
    }
  }

  return { lines: [`theme set to ${name}`], theme: name, persist: true }
}

// localStorage is missing during SSR and in some tests, and reading it throws
// when the browser blocks storage. The in-memory theme still applies.
export function availableStorage(): ThemeStorage | null {
  try {
    if (typeof globalThis.localStorage === 'undefined') {
      return null
    }
    return globalThis.localStorage
  } catch {
    return null
  }
}

export function readStoredTheme(
  storage: ThemeStorage | null = availableStorage(),
): ThemeName {
  if (!storage) {
    return DEFAULT_THEME
  }

  try {
    const stored = storage.getItem(THEME_STORAGE_KEY)
    if (stored !== null && isThemeName(stored)) {
      return stored
    }
  } catch {
    // A storage that throws is treated as missing.
  }

  return DEFAULT_THEME
}

export function storeTheme(
  theme: ThemeName,
  storage: ThemeStorage | null = availableStorage(),
): void {
  if (!storage) {
    return
  }

  try {
    storage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Quota or a locked storage should not break the shell.
  }
}

export function applyTheme(theme: ThemeName): void {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = theme
}
