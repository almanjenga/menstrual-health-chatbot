import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Heart, 
  Globe, 
  Shield, 
  Trash2, 
  LogOut, 
  Edit2, 
  Check, 
  X,
  Moon,
  Sun
} from "lucide-react";
import { onAuthStateChanged, signOut, updateProfile, deleteUser } from "firebase/auth";
import { auth } from "./Config";
import { useDarkMode } from "./contexts/DarkModeContext";
import { useLanguage } from "./contexts/LanguageContext";
import { getTranslation } from "./utils/translations";
import { Button } from "./components/ui/Button";
import { Input } from "./components/ui/Input";
import { Label } from "./components/ui/Label";
import { Switch } from "./components/ui/Switch";
import { Avatar } from "./components/ui/Avatar";
import { Card } from "./components/ui/Card";
import { Separator } from "./components/ui/Separator";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const { language, setLanguage } = useLanguage();
  const { darkMode, setDarkMode } = useDarkMode();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("🌸");
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const avatarOptions = ["🌸", "💗", "🌺", "🌷", "🌻"];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setEditedName(currentUser.displayName || currentUser.email.split("@")[0]);
        // Load saved avatar from localStorage
        const savedAvatar = localStorage.getItem(`avatar_${currentUser.uid}`);
        if (savedAvatar && avatarOptions.includes(savedAvatar)) {
          setSelectedAvatar(savedAvatar);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);


  // Close avatar selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAvatarSelector && !event.target.closest('.avatar-selector-container')) {
        setShowAvatarSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAvatarSelector]);

  const handleSaveName = async () => {
    if (!user || !editedName.trim()) return;
    
    try {
      await updateProfile(user, { displayName: editedName.trim() });
      await user.reload();
      setUser({ ...user, displayName: editedName.trim() });
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update name. Please try again.");
    }
  };

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
    if (user) {
      localStorage.setItem(`avatar_${user.uid}`, avatar);
    }
    setShowAvatarSelector(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  const handleClearChatHistory = async () => {
    if (window.confirm("Are you sure you want to clear all chat history? This action cannot be undone.")) {
      try {
        if (user) {
          // Clear chat history from backend
          const response = await fetch("http://127.0.0.1:5000/chat/clear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.uid }),
          });
          
          if (response.ok) {
            alert("Chat history cleared successfully! 💕");
          } else {
            throw new Error("Failed to clear chat history");
          }
        } else {
          alert("Please log in to clear chat history.");
        }
      } catch (error) {
        console.error("Error clearing chat history:", error);
        alert("Failed to clear chat history. Please try again.");
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    if (!user) return;

    try {
      await deleteUser(user);
      alert("Account deleted successfully.");
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-pink-50/40 via-purple-50/30 to-pink-50/20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-rose-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-pink-50/40 via-purple-50/30 to-pink-50/20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-pink-100/50 max-w-md w-full text-center"
        >
          <User className="w-16 h-16 mx-auto mb-4 text-rose-300" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Please Log In</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to view your profile.
          </p>
          <Button onClick={() => navigate("/login")} className="w-full">
            Go to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  const userName = user.displayName || user.email.split("@")[0];
  const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-pink-50/40 via-purple-50/30 to-pink-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 sm:px-6 py-8 relative overflow-hidden">
      {/* Background Elements */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 120, ease: "linear" }}
        className="absolute top-10 left-10 w-80 h-80 bg-rose-200/20 dark:bg-rose-900/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 140, ease: "linear" }}
        className="absolute bottom-10 right-10 w-96 h-96 bg-violet-200/20 dark:bg-violet-900/20 rounded-full blur-3xl"
      />

      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        {/* Profile Header */}
        <Card className="text-center dark:bg-gray-800/90 dark:border-gray-700">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative inline-block avatar-selector-container"
          >
            <div className="relative">
              <Avatar 
                src={user.photoURL && user.photoURL.trim() !== "" ? user.photoURL : null} 
                name={userName} 
                size="xl" 
                className="mx-auto mb-4"
                emoji={selectedAvatar}
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                className="absolute bottom-2 right-0 bg-white rounded-full p-2 shadow-lg border-2 border-rose-200 hover:border-rose-300 transition-colors"
                title="Change avatar"
              >
                <Edit2 className="w-4 h-4 text-rose-500" />
              </motion.button>
            </div>
            
            {/* Avatar Selector */}
            <AnimatePresence>
              {showAvatarSelector && (
                <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 bg-white rounded-2xl shadow-xl border border-rose-200/50 p-4 z-50"
              >
                <p className="text-sm font-medium text-gray-700 mb-3">Choose your avatar</p>
                <div className="flex gap-3">
                  {avatarOptions.map((avatar) => (
                    <motion.button
                      key={avatar}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAvatarSelect(avatar)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                        selectedAvatar === avatar
                          ? "bg-rose-100 border-2 border-rose-400 scale-110"
                          : "bg-gray-50 border-2 border-gray-200 hover:border-rose-300"
                      }`}
                    >
                      {avatar}
                    </motion.button>
                  ))}
                </div>
                <button
                  onClick={() => setShowAvatarSelector(false)}
                  className="mt-3 text-xs text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          <div className="space-y-3">
            {isEditingName ? (
              <div className="flex items-center justify-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="max-w-xs mx-auto"
                  autoFocus
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSaveName}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Check className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setIsEditingName(false);
                    setEditedName(userName);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-100">
                  {capitalizedName}
                </h1>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsEditingName(true)}
                  className="p-2 text-rose-500 hover:bg-rose-50/50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </motion.button>
              </div>
            )}
            
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
          </div>
        </Card>

        {/* Settings */}
        <Card className="dark:bg-gray-800/90 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-rose-400 dark:text-rose-400" />
            Settings
          </h2>
          <div className="space-y-4">
            <Switch
              label={getTranslation("language", language)}
              checked={language === "sw"}
              onCheckedChange={(checked) => setLanguage(checked ? "sw" : "en")}
            />
            <Separator />
            <Switch
              label={
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  {darkMode ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                  Dark Mode
                </div>
              }
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          </div>
        </Card>

        {/* Actions */}
        <Card className="dark:bg-gray-800/90 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-400 dark:text-rose-400" />
            Actions
          </h2>
          <div className="space-y-3">
            <Button
              variant="secondary"
              onClick={handleClearChatHistory}
              className="w-full flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Chat History
            </Button>
            <Button
              variant="secondary"
              onClick={() => alert("Privacy & Data Policy coming soon!")}
              className="w-full flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Privacy & Data Policy
            </Button>
            <Separator />
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {showDeleteConfirm ? "Confirm Delete Account" : "Delete Account"}
            </Button>
            {showDeleteConfirm && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 text-center"
              >
                This action cannot be undone. All your data will be permanently deleted.
              </motion.p>
            )}
          </div>
        </Card>

        {/* Privacy Info Card */}
        <Card className="bg-gradient-to-br from-rose-50/40 to-pink-50/30 dark:from-gray-800/90 dark:to-gray-700/90 border-rose-200/30 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <Heart className="w-6 h-6 text-rose-400 dark:text-rose-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Privacy & Confidentiality</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Your conversations with Eunoia are completely private and confidential. 
                We use end-to-end encryption to protect your data, and your personal information 
                is never shared with third parties. Your health information is handled with 
                the utmost care and respect for your privacy.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;

