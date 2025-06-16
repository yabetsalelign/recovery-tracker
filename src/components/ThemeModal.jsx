import React, { useState, useEffect, useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

const ThemeModal = () => {
  const { toggleTheme } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenModal = sessionStorage.getItem("hasSeenThemeModal");
    if (!hasSeenModal) {
      setIsOpen(true);
      sessionStorage.setItem("hasSeenThemeModal", "true");
    }
  }, []);

  const handleThemeSelect = (theme) => {
    toggleTheme(theme);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-xl font-semibold text-peach-800 dark:text-peach-300 mb-4 text-center">
          Choose Your Theme
        </h2>
        <p className="text-coral-600 dark:text-coral-300 mb-6 text-center">
          Would you like to use light or dark mode?
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleThemeSelect("light")}
            className="px-4 py-2 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200 transform transition-all duration-500 ease-in-out hover:scale-105"
          >
            Light Mode
          </button>
          <button
            onClick={() => handleThemeSelect("dark")}
            className="px-4 py-2 text-sm rounded-md font-medium bg-peach-300 text-gray-800 hover:bg-peach-400 transition-colors duration-200 transform transition-all duration-500 ease-in-out hover:scale-105"
          >
            Dark Mode
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeModal;