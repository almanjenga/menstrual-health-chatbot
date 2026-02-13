import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Load from localStorage, default to "en"
    const saved = localStorage.getItem("appLanguage");
    return saved || "en";
  });

  useEffect(() => {
    // Save to localStorage whenever language changes
    localStorage.setItem("appLanguage", language);
  }, [language]);

  const setLanguageCode = (code) => {
    setLanguage(code); // "en" or "sw"
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setLanguageCode }}>
      {children}
    </LanguageContext.Provider>
  );
};


