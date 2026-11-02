import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import ThemePreview from "./ThemePreview";
import { useOverlayBackHandler } from "./BackNavigation";

const ThemeModal: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("hasSeenThemeModal") || sessionStorage.getItem("hasSeenThemeModal");
    const existingTheme = localStorage.getItem("theme");
    if (!hasSeen && !existingTheme) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = useCallback(() => {
    localStorage.setItem("hasSeenThemeModal", "true");
    sessionStorage.setItem("hasSeenThemeModal", "true");
    setIsOpen(false);
  }, []);
  useOverlayBackHandler(isOpen, handleClose);

  const handleThemeSelect = (selectedTheme: string) => {
    toggleTheme(selectedTheme);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-modal-heading"
        className="w-full max-w-sm bg-white dark:bg-[#2A2522] rounded-2xl p-6 border border-[#D2C3BE] dark:border-[#39302B] shadow-xl space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#D2C3BE]/50 dark:border-[#39302B]">
          <h3 id="theme-modal-heading" className="font-serif text-xl font-medium text-[#261810] dark:text-[#F4EFEA]">
            Choose your theme
          </h3>
          <button
            onClick={handleClose}
            className="min-h-11 min-w-11 rounded-xl flex items-center justify-center text-[#6B5B54] dark:text-[#A99A8F] hover:text-[#261810]"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <p className="text-xs text-[#6B5B54] dark:text-[#A99A8F]">
          You can change this anytime in Settings.
        </p>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <ThemePreview
            theme="light"
            selected={theme === "light"}
            onSelect={() => handleThemeSelect("light")}
          />
          <ThemePreview
            theme="dark"
            selected={theme === "dark"}
            onSelect={() => handleThemeSelect("dark")}
          />
        </div>
      </div>
    </div>
  );
};

export default ThemeModal;
