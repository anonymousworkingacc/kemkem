import * as React from "react"

/** `bw` for black & white e-ink (default), `color` for colour e-ink. */
export type Theme = "bw" | "color"

export const THEME_STORAGE_KEY = "kemkem-theme"
const THEMES: Theme[] = ["bw", "color"]

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = React.createContext<
  ThemeProviderState | undefined
>(undefined)

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (THEMES.includes(stored as Theme)) return stored as Theme
  } catch {
    // Storage can be blocked; fall back to the default.
  }
  return "bw"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(readStoredTheme)

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const setTheme = React.useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Not persisted, but still applied for this visit.
    }
    setThemeState(next)
  }, [])

  const value = React.useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
