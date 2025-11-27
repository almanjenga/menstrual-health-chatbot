import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, MessageCircle, BookOpen, User, Globe, Menu, X, Calendar } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { getTranslation } from "../utils/translations";

const Navbar = () => {
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const languages = [
    { code: "en", name: "English" },
    { code: "sw", name: "Kiswahili" },
  ];

  // Get display name for current language
  const selectedLanguageName = languages.find(l => l.code === language)?.name || "English";

  const navLinks = [
    { path: "/home", label: getTranslation("home", language), icon: Home },
    { path: "/chat", label: getTranslation("chat", language), icon: MessageCircle },
    { path: "/education", label: getTranslation("education", language), icon: BookOpen },
    { path: "/track-cycle", label: getTranslation("trackCycle", language), icon: Calendar },
  ];

  const isActive = (path) => {
    if (path === "/home") {
      return location.pathname === "/home" || location.pathname === "/";
    }
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-rose-200/50 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 group"
          >
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 bg-clip-text text-transparent"
            >
              Eunoia
            </motion.span>
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-xl"
            >
              🌸
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 flex-1 justify-center">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="relative"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30 text-rose-600 dark:text-rose-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-rose-50/50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{link.label}</span>
                  </motion.div>
                  {active && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full"
                      initial={false}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Side - Profile & Language */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/60 hover:bg-white/80 border border-rose-200 text-gray-700 transition-all duration-200"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">{selectedLanguageName}</span>
              </motion.button>

              <AnimatePresence>
                {isLanguageOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsLanguageOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-40 bg-white/95 backdrop-blur-lg rounded-lg shadow-lg border border-rose-200/50 overflow-hidden z-20"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code);
                            setIsLanguageOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            language === lang.code
                              ? "bg-rose-50 text-rose-600 font-medium"
                              : "text-gray-700 dark:text-gray-300 hover:bg-rose-50/50 dark:hover:bg-gray-800"
                          }`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Icon */}
            <Link to="/profile">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-full transition-colors ${
                  isActive("/profile")
                    ? "bg-gradient-to-r from-rose-400 to-pink-400 text-white"
                    : "bg-rose-100 text-rose-500 hover:bg-rose-200"
                }`}
              >
                <User className="w-5 h-5" />
              </motion.div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-rose-50/50 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-lg border-t border-rose-200/50"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      active
                        ? "bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30 text-rose-600 dark:text-rose-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-rose-50/50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-pink-200/50 flex items-center justify-between">
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-rose-50/50"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">{getTranslation("profile", language)}</span>
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                    className="flex items-center space-x-2 px-4 py-3 rounded-lg bg-rose-50 text-gray-700"
                  >
                    <Globe className="w-5 h-5" />
                    <span className="font-medium">{selectedLanguage}</span>
                  </button>
                  {isLanguageOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-rose-200/50 overflow-hidden z-20">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code);
                            setIsLanguageOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            language === lang.code
                              ? "bg-rose-50 text-rose-600 font-medium"
                              : "text-gray-700 dark:text-gray-300 hover:bg-rose-50/50 dark:hover:bg-gray-800"
                          }`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

