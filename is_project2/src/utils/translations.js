export const translations = {
  en: {
    // Navbar
    home: "Home",
    chat: "Chat",
    education: "Education",
    trackCycle: "Track Cycle",
    profile: "Profile",
    
    // Chat
    messagePlaceholder: "Message Eunoia...",
    typing: "Eunoia is typing...",
    greeting: ({ name }) => `👋 Hello ${name}💕! I'm Eunoia — your menstrual wellness companion. How are you feeling today?`,
    
    // Profile
    clearChatHistory: "Clear Chat History",
    deleteAccount: "Delete Account",
    language: "Language: English / Kiswahili",
  },
  sw: {
    // Navbar
    home: "Nyumbani",
    chat: "Mazungumzo",
    education: "Elimu",
    trackCycle: "Fuatilia Mzunguko",
    profile: "Wasifu",
    
    // Chat
    messagePlaceholder: "Tuma ujumbe kwa Eunoia...",
    typing: "Eunoia anaandika...",
    greeting: ({ name }) => `👋 Hujambo ${name}💕! Mimi ni Eunoia — msaidizi wako wa afya ya hedhi. Unajisikiaje leo?`,
    
    // Profile
    clearChatHistory: "Futa Historia ya Mazungumzo",
    deleteAccount: "Futa Akaunti",
    language: "Lugha: Kiingereza / Kiswahili",
  }
};

export const getTranslation = (key, language = "en", params = {}) => {
  const lang = translations[language] || translations.en;
  const value = lang[key];
  
  if (typeof value === "function") {
    return value(params);
  }
  return value || key;
};

