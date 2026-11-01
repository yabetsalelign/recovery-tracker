import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

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

  const handleClose = () => {
    localStorage.setItem("hasSeenThemeModal", "true");
    sessionStorage.setItem("hasSeenThemeModal", "true");
    setIsOpen(false);
  };

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
          <button
            type="button"
            aria-pressed={theme === "light"}
            onClick={() => handleThemeSelect("light")}
            className={`min-h-11 p-3 rounded-xl border text-left transition-colors ${
              theme === "light"
                ? "border-[#3D2C24] bg-[#FBF2E7]"
                : "border-[#D2C3BE]/60 bg-white"
            }`}
          >
            <span className="block font-semibold text-xs text-[#261810]">Warm Paper</span>
            <span className="text-[11px] text-[#6B5B54]">Ivory & cream</span>
          </button>

          <button
            type="button"
            aria-pressed={theme === "dark"}
            onClick={() => handleThemeSelect("dark")}
            className={`min-h-11 p-3 rounded-xl border text-left transition-colors ${
              theme === "dark"
                ? "border-[#D47A55] bg-[#1E1B18]"
                : "border-[#39302B] bg-[#1E1B18]"
            }`}
          >
            <span className="block font-semibold text-xs text-[#F4EFEA]">Charcoal Night</span>
            <span className="text-[11px] text-[#A99A8F]">Warm dark charcoal</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeModal;
