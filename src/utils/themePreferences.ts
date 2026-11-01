import type { ThemeMode } from "../types";

export const resolveInitialTheme = (
  savedTheme: string | null,
  prefersDark: boolean
): ThemeMode => {
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return prefersDark ? "dark" : "light";
};
