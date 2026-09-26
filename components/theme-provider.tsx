"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"
type Ctx = { resolvedTheme: Theme | undefined; setTheme: (t: Theme) => void }

const ThemeContext = createContext<Ctx>({ resolvedTheme: undefined, setTheme: () => {} })
const KEY = "theme"

// Runs in <head> before paint (rendered by the server layout) so there is no
// flash of the wrong theme. Stored choice wins, otherwise follow the OS.
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${KEY}');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}var d=document.documentElement;d.classList.toggle('dark',t==='dark');d.style.colorScheme=t}catch(e){}})()`

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme | undefined>(undefined)

  useEffect(() => {
    setThemeState(document.documentElement.classList.contains("dark") ? "dark" : "light")
    // follow OS changes unless the user picked a theme explicitly
    const mq = matchMedia("(prefers-color-scheme: dark)")
    const onChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem(KEY)) return
      apply(e.matches ? "dark" : "light")
      setThemeState(e.matches ? "dark" : "light")
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    try {
      localStorage.setItem(KEY, t)
    } catch {}
    apply(t)
    setThemeState(t)
  }, [])

  return <ThemeContext.Provider value={{ resolvedTheme: theme, setTheme }}>{children}</ThemeContext.Provider>
}

function apply(t: Theme) {
  const d = document.documentElement
  d.classList.toggle("dark", t === "dark")
  d.style.colorScheme = t
}

export const useTheme = () => useContext(ThemeContext)
