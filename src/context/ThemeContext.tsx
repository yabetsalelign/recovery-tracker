import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { ThemeContextType } from "../types";
import { resolveInitialTheme } from "../utils/themePreferences";

export const ThemeContext = createContext<ThemeContextType | null>(null);

const getPreferredTheme = (): "light" | "dark" => {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return resolveInitialTheme(savedTheme, prefersDark);
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<string>(getPreferredTheme);
  const [hasExplicitTheme, setHasExplicitTheme] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "light" || savedTheme === "dark";
  });
  const [fontScale, setFontScale] = useState<string>(() => localStorage.getItem("fontScale") || "standard");
  const [gentleTransitions, setGentleTransitions] = useState<boolean>(
    () => localStorage.getItem("gentleTransitions") === "true"
  );
  const [discreetMode, setDiscreetMode] = useState<boolean>(
    () => localStorage.getItem("discreetMode") === "true"
  );

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#1A1614" : "#FFF8F2");
    if (hasExplicitTheme) localStorage.setItem("theme", theme);
  }, [theme, hasExplicitTheme]);

  useEffect(() => {
    if (fontScale === "comfort") {
      document.body.classList.add("font-scale-comfort");
    } else {
      document.body.classList.remove("font-scale-comfort");
    }
    localStorage.setItem("fontScale", fontScale);
  }, [fontScale]);

  useEffect(() => {
    if (gentleTransitions) {
      document.body.classList.add("gentle-transitions");
    } else {
      document.body.classList.remove("gentle-transitions");
    }
    localStorage.setItem("gentleTransitions", String(gentleTransitions));
  }, [gentleTransitions]);

  useEffect(() => {
    localStorage.setItem("discreetMode", String(discreetMode));
  }, [discreetMode]);

  const toggleTheme = (newTheme: string) => {
    if (newTheme !== "light" && newTheme !== "dark") return;
    setHasExplicitTheme(true);
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        fontScale,
        setFontScale,
        gentleTransitions,
        setGentleTransitions,
        discreetMode,
        setDiscreetMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
