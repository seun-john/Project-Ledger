"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { THEME_STORAGE_KEY, type ThemePreference } from "@/lib/theme";

export type { ThemePreference };

interface ThemeContextValue {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "auto", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  // Removing the attribute (rather than setting "auto") is what hands control
  // back to the prefers-color-scheme block in globals.css.
  if (theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Starts at "auto" on both server and client so hydration matches; the inline
  // script in layout.tsx has already painted the correct colours by now, and the
  // effect below reconciles the toggle's highlighted state a tick later.
  const [theme, setThemeState] = useState<ThemePreference>("auto");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === "light" || saved === "dark") setThemeState(saved);
    } catch {
      /* private mode / storage disabled — stay on auto */
    }
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    applyTheme(next);
    try {
      if (next === "auto") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* preference just won't persist */
    }
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
