import React, { createContext, useContext, useState, useEffect } from "react";

const DarkModeContext = createContext();

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  }
  return context;
};

export const DarkModeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Load from localStorage on initial render - only activate if user explicitly set it
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Default to false - don't auto-detect system preference
    return false;
  });

  useEffect(() => {
    // Apply dark class to document immediately on mount
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []); // Only run on mount

  useEffect(() => {
    // Save to localStorage whenever darkMode changes
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    
    // Apply dark class to document when toggled
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

