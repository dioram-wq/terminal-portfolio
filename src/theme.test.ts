import { afterEach, describe, expect, it } from 'vitest'
import {
  applyTheme,
  availableStorage,
  DEFAULT_THEME,
  readStoredTheme,
  storeTheme,
  THEME_STORAGE_KEY,
  themeCommand,
  type ThemeStorage,
} from './theme.ts'

function memoryStorage(initial?: Record<string, string>): ThemeStorage {
  const data = new Map<string, string>(Object.entries(initial ?? {}))
  return {
    getItem(key) {
      return data.get(key) ?? null
    },
    setItem(key, value) {
      data.set(key, value)
    },
  }
}

afterEach(() => {
  localStorage.removeItem(THEME_STORAGE_KEY)
  delete document.documentElement.dataset.theme
})

describe('themeCommand', () => {
  it('lists the themes and marks the current one', () => {
    expect(themeCommand([], 'green')).toEqual({
      lines: ['green  current', 'amber', 'mono'],
      theme: 'green',
      persist: false,
    })

    expect(themeCommand([], 'amber')).toEqual({
      lines: ['green', 'amber  current', 'mono'],
      theme: 'amber',
      persist: false,
    })

    expect(themeCommand([], 'mono')).toEqual({
      lines: ['green', 'amber', 'mono   current'],
      theme: 'mono',
      persist: false,
    })
  })

  it('switches to a theme and confirms it', () => {
    expect(themeCommand(['amber'], 'green')).toEqual({
      lines: ['theme set to amber'],
      theme: 'amber',
      persist: true,
    })

    expect(themeCommand(['mono'], 'amber')).toEqual({
      lines: ['theme set to mono'],
      theme: 'mono',
      persist: true,
    })

    expect(themeCommand(['green'], 'green')).toEqual({
      lines: ['theme set to green'],
      theme: 'green',
      persist: true,
    })
  })

  it('rejects an unknown theme and leaves the current one unchanged', () => {
    expect(themeCommand(['nope'], 'amber')).toEqual({
      lines: ['theme: nope: No such theme'],
      theme: 'amber',
      persist: false,
    })

    expect(themeCommand(['Green'], 'mono')).toEqual({
      lines: ['theme: Green: No such theme'],
      theme: 'mono',
      persist: false,
    })

    expect(themeCommand(['amber', 'mono'], 'green')).toEqual({
      lines: ['theme: too many arguments'],
      theme: 'green',
      persist: false,
    })
  })
})

describe('theme storage', () => {
  it('remembers the choice in localStorage', () => {
    localStorage.removeItem(THEME_STORAGE_KEY)

    expect(readStoredTheme()).toBe('green')
    expect(readStoredTheme()).toBe(DEFAULT_THEME)

    storeTheme('amber')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('amber')
    expect(readStoredTheme()).toBe('amber')

    storeTheme('mono')
    expect(readStoredTheme()).toBe('mono')

    storeTheme('green')
    expect(readStoredTheme()).toBe('green')

    const memory = memoryStorage()
    expect(readStoredTheme(memory)).toBe('green')
    storeTheme('amber', memory)
    expect(readStoredTheme(memory)).toBe('amber')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('green')
  })

  it('falls back to green when the saved value is not a theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'nope')
    expect(readStoredTheme()).toBe('green')

    localStorage.setItem(THEME_STORAGE_KEY, 'Green')
    expect(readStoredTheme()).toBe('green')

    localStorage.setItem(THEME_STORAGE_KEY, '')
    expect(readStoredTheme()).toBe('green')

    const memory = memoryStorage({ [THEME_STORAGE_KEY]: ' amber' })
    expect(readStoredTheme(memory)).toBe('green')
  })

  it('ignores a missing or broken localStorage', () => {
    expect(readStoredTheme(null)).toBe('green')
    expect(() => storeTheme('amber', null)).not.toThrow()
    expect(readStoredTheme(null)).toBe('green')

    const broken: ThemeStorage = {
      getItem() {
        throw new Error('blocked')
      },
      setItem() {
        throw new Error('blocked')
      },
    }
    expect(readStoredTheme(broken)).toBe('green')
    expect(() => storeTheme('mono', broken)).not.toThrow()

    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('localStorage is unavailable')
      },
    })
    try {
      expect(availableStorage()).toBeNull()
      expect(readStoredTheme()).toBe('green')
      expect(() => storeTheme('amber')).not.toThrow()
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, 'localStorage', descriptor)
      }
    }

    expect(readStoredTheme()).toBe('green')
  })

  it('applies the theme on the document element', () => {
    applyTheme('amber')
    expect(document.documentElement.dataset.theme).toBe('amber')

    applyTheme('mono')
    expect(document.documentElement.dataset.theme).toBe('mono')

    applyTheme('green')
    expect(document.documentElement.dataset.theme).toBe('green')
  })
})
