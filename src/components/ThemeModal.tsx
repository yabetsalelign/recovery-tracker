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
    <div className="fixed inset-0 z-50 bg-[#252B25]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-modal-heading"
        className="w-full max-w-sm bg-white dark:bg-[#212521] rounded-2xl p-6 shadow-xl border border-[#E3DED5] dark:border-[#313831] space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#E3DED5] dark:border-[#313831]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#46644B] text-[22px]">palette</span>
            <h3 id="theme-modal-heading" className="font-serif text-xl font-medium text-[#252B25] dark:text-[#E8EBDD]">Choose your atmosphere</h3>
          </div>
          <button
            onClick={handleClose}
            className="min-h-11 min-w-11 rounded-lg flex items-center justify-center text-[#77786F] hover:bg-black/5 dark:hover:bg-white/5"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <p className="text-xs text-[#77786F] dark:text-[#A6ABA0] leading-relaxed">
          Warm paper by day, dark espresso by night. You can change this anytime in Settings.
        </p>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            aria-pressed={theme === "light"}
            onClick={() => handleThemeSelect("light")}
            className={`min-h-11 p-3 rounded-xl border text-left transition-all ${
              theme === "light"
                ? "border-[#46644B] bg-[#E8EBDD]/40"
                : "border-[#E3DED5] bg-[#F7F4EE] hover:border-[#46644B]"
            }`}
          >
            <span className="block font-semibold text-xs text-[#252B25]">Warm Paper</span>
            <span className="text-[11px] text-[#77786F]">Cream, blush, and espresso</span>
          </button>
          <button
            type="button"
            aria-pressed={theme === "dark"}
            onClick={() => handleThemeSelect("dark")}
            className={`min-h-11 p-3 rounded-xl border text-left transition-all ${
              theme === "dark"
                ? "border-[#8EAA92] bg-[#2C332C]"
                : "border-[#313831] bg-[#181B18] hover:border-[#8EAA92]"
            }`}
          >
            <span className="block font-semibold text-xs text-[#E8EBDD]">Charcoal Night</span>
            <span className="text-[11px] text-[#A6ABA0]">Warm charcoal and antique cream</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeModal;
