/** Stored in localStorage. The inline script in the root layout uses this same key. */
export const THEME_STORAGE_KEY = "om-theme";

export const THEME_COLORS = {
  dark: "#2a303b",
  light: "#f3efe6",
} as const;

export type ThemeName = keyof typeof THEME_COLORS;
