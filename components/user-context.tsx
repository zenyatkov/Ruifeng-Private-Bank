"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type UserPrefs = { lang: string; currency: string; firstName: string; lastName: string; theme?: Theme };

const UserPrefsContext = createContext<UserPrefs>({ lang: "en", currency: "SGD", firstName: "", lastName: "", theme: "light" });

export function UserPrefsProvider({ value, children }: { value: UserPrefs; children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(value.theme || "light");

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function handler(e: MediaQueryListEvent) {
      document.documentElement.classList.toggle("dark", e.matches);
    }
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  // Persist theme preference
  useEffect(() => {
    localStorage.setItem("ruiFengTheme", theme);
  }, [theme]);

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("ruiFengTheme") as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  const enhancedValue = { ...value, theme };

  return <UserPrefsContext.Provider value={enhancedValue}>{children}</UserPrefsContext.Provider>;
}

export function useUserPrefs() {
  return useContext(UserPrefsContext);
}

export function useTheme() {
  const { theme } = useContext(UserPrefsContext);
  return theme;
}

export function ThemeToggle() {
  const prefs = useContext(UserPrefsContext);
  const [current, setCurrent] = useState<Theme>(prefs.theme ?? "light");

  useEffect(() => {
    const saved = localStorage.getItem("ruiFengTheme") as Theme | null;
    if (saved) setCurrent(saved);
  }, []);

  function toggle() {
    const next = current === "dark" ? "light" : current === "light" ? "system" : "dark";
    setCurrent(next);
    localStorage.setItem("ruiFengTheme", next);
    
    const root = document.documentElement;
    if (next === "dark" || (next === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Save to server
    fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ themePreference: next }) }).catch(() => {});
  }

  const icon = current === "dark" ? "🌙" : current === "system" ? "💻" : "☀️";
  const label = current === "dark" ? "Dark" : current === "system" ? "System" : "Light";

  return (
    <button onClick={toggle} className="flex items-center gap-1.5 rounded-xl border border-ink-900/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-800 hover:bg-rice-100 transition" title={`Theme: ${label}. Click to cycle.`}>
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
