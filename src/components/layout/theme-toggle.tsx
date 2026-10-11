"use client";

import { useEffect, useState } from "react";

import { THEME_COLORS, THEME_STORAGE_KEY, type ThemeName } from "@/constants/theme";

function readTheme(): ThemeName {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>("dark");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  function apply(value: ThemeName) {
    document.documentElement.dataset.theme = value;
    localStorage.setItem(THEME_STORAGE_KEY, value);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[value]);
    setTheme(value);
  }

  const next: ThemeName = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => apply(next)}
      aria-pressed={theme === "dark"}
      aria-label={`Switch to ${next} theme`}
      className="text-sm font-medium text-ink"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
