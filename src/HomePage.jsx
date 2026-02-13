import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  MessageCircle, 
  BookOpen, 
  Calendar, 
  User, 
  TrendingUp,
  Bell,
  ArrowRight,
  Smile,
  Heart,
  Sparkles,
  X
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./Config";
import { Card } from "./components/ui/Card";
import { Button } from "./components/ui/Button";

const HomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState("😊");
  const [currentDay, setCurrentDay] = useState(5);
  const [cycleLength, setCycleLength] = useState(28);
  const [daysUntilPeriod, setDaysUntilPeriod] = useState(23);
  const [showMoodMessage, setShowMoodMessage] = useState(false);
  const [moodMessage, setMoodMessage] = useState("");
  const [recentChats, setRecentChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);

  const moods = ["😊", "😌", "😢", "😴", "😤", "💪", "🤗", "😍"];

  const moodMessages = {
    "😊": "I'm so glad you're feeling happy! Remember to take care of yourself and stay hydrated. If you need anything, I'm here for you! 💕",
    "😌": "Feeling calm and peaceful is wonderful! Take this moment to appreciate your body and all it does for you. You're doing great! 🌸",
    "😢": "I'm sorry you're feeling down. Remember that your feelings are valid, and it's okay to not be okay. Would you like to chat about what's on your mind? I'm here to listen. 💗",
    "😴": "Feeling tired? Make sure you're getting enough rest and taking care of yourself. Your body needs rest, especially during your cycle. Take it easy! 😴",
    "😤": "I understand you might be feeling frustrated or irritated. This is completely normal, especially with hormonal changes. Take deep breaths, and remember I'm here if you need to talk. 💪",
    "💪": "You're feeling strong and energetic! That's amazing! Use this energy to take care of yourself and do things that make you happy. You've got this! 🌟",
    "🤗": "Feeling warm and caring? That's beautiful! Remember to extend that same care to yourself. You deserve all the love and kindness. 💕",
    "😍": "You're feeling amazing! I love to see you happy and confident. Keep that positive energy flowing! You're wonderful just as you are! ✨"
  };

  // Load recent conversations
  const loadRecentChats = async (user_id) => {
    setLoadingChats(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/chat/conversations?user_id=${user_id}`
      );
      const data = await response.json();
      if (data.conversations) {
        // Filter out empty conversations (0 messages or only greeting with 1 message)
        const nonEmptyChats = data.conversations.filter(
          (conv) => conv.message_count > 1
        );
        // Get the 3 most recent non-empty conversations
        const recent = nonEmptyChats.slice(0, 3);
        setRecentChats(recent);
      }
    } catch (error) {
      console.error("Error loading recent chats:", error);
      setRecentChats([]);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Load saved cycle data from localStorage
        const savedCycle = localStorage.getItem(`cycle_${currentUser.uid}`);
        if (savedCycle) {
          const cycleData = JSON.parse(savedCycle);
          // Calculate current day and days until period if not present
          let currentDay = cycleData.currentDay;
          let daysUntilPeriod = cycleData.daysUntilPeriod;
          
          if (cycleData.lastPeriodStart && cycleData.cycleLength) {
            const lastPeriod = new Date(cycleData.lastPeriodStart);
            const today = new Date();
            const diffTime = today - lastPeriod;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const dayOfCycle = (diffDays % cycleData.cycleLength) + 1;
            currentDay = dayOfCycle;
            daysUntilPeriod = cycleData.cycleLength - dayOfCycle + 1;
            if (daysUntilPeriod > cycleData.cycleLength) {
              daysUntilPeriod = daysUntilPeriod - cycleData.cycleLength;
            }
          }
          
          setCurrentDay(currentDay || 5);
          setCycleLength(cycleData.cycleLength || 28);
          setDaysUntilPeriod(daysUntilPeriod || 23);
        }
        // Load saved mood
        const savedMood = localStorage.getItem(`mood_${currentUser.uid}`);
        if (savedMood) {
          setSelectedMood(savedMood);
        }
        // Load recent chats
        loadRecentChats(currentUser.uid);
      } else {
        navigate("/");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    if (user) {
      localStorage.setItem(`mood_${user.uid}`, mood);
    }
    // Show mood message popup
    setMoodMessage(moodMessages[mood]);
    setShowMoodMessage(true);
  };

  const quickActions = [
    { icon: MessageCircle, label: "Chat", path: "/chat", color: "from-rose-400 to-pink-400" },
    { icon: BookOpen, label: "Education", path: "/education", color: "from-purple-400 to-pink-400" },
    { icon: Calendar, label: "Track Cycle", path: "/track-cycle", color: "from-pink-400 to-rose-400" },
    { icon: User, label: "Profile", path: "/profile", color: "from-rose-400 to-purple-400" },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    
    // Reset time to midnight for accurate day comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = today - messageDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays <= 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const educationTopics = [
    { title: "Understanding Your Cycle", icon: "📅" },
    { title: "PMS Management", icon: "💊" },
    { title: "Nutrition & Wellness", icon: "🥗" },
    { title: "Mental Health Support", icon: "🧘" },
  ];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-pink-50/40 via-purple-50/30 to-pink-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-rose-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userName = user.displayName || user.email.split("@")[0];
  const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);
  const timeOfDay = new Date().getHours();
  const greeting = timeOfDay < 12 ? "Good morning" : timeOfDay < 18 ? "Good afternoon" : "Good evening";

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

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        {/* Greeting & Mood Section */}
        <Card className="dark:bg-gray-800/90 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl sm:text-4xl font-semibold text-gray-800 dark:text-gray-100 mb-2"
              >
                {greeting}, {capitalizedName} {selectedMood}
              </motion.h1>
              <p className="text-gray-600 dark:text-gray-400">
                How are you feeling today?
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {moods.map((mood) => (
                <motion.button
                  key={mood}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleMoodSelect(mood)}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    selectedMood === mood
                      ? "bg-gradient-to-r from-rose-400 to-pink-400 scale-110 shadow-lg"
                      : "bg-white/60 dark:bg-gray-700/60 hover:bg-rose-50 dark:hover:bg-gray-600"
                  }`}
                >
                  {mood}
                </motion.button>
              ))}
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card
                    className="dark:bg-gray-800/90 dark:border-gray-700 cursor-pointer text-center hover:shadow-xl transition-all"
                    onClick={() => navigate(action.path)}
                  >
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mini Cycle Snapshot */}
          <Card className="lg:col-span-1 dark:bg-gray-800/90 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-400" />
              Cycle Snapshot
            </h3>
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Day</p>
                <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">{currentDay}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">of {cycleLength} days</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Days Until Period</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{daysUntilPeriod}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => navigate("/track-cycle")}
                className="w-full"
              >
                View Full Calendar
              </Button>
            </div>
          </Card>

          {/* Recent Chats */}
          <Card className="lg:col-span-2 dark:bg-gray-800/90 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-rose-400" />
                Recent Chats
              </h3>
              {recentChats.length > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => navigate("/chat")}
                  className="text-sm"
                >
                  View All
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {loadingChats ? (
                <div className="flex items-center justify-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-4 border-rose-400 border-t-transparent rounded-full"
                  />
                </div>
              ) : recentChats.length > 0 ? (
                <>
                  {recentChats.map((chat, index) => (
                    <motion.div
                      key={chat.conversation_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                      onClick={() => navigate("/chat", { state: { conversationId: chat.conversation_id } })}
                      className="bg-gradient-to-r from-rose-50/50 to-pink-50/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all border border-rose-200/30 dark:border-gray-600"
                    >
                      <p className="text-gray-800 dark:text-gray-200 font-medium mb-1 truncate">
                        {chat.title || "New Chat"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(chat.updated_at)}
                      </p>
                    </motion.div>
                  ))}
                  <Button
                    variant="primary"
                    onClick={() => navigate("/chat")}
                    className="w-full mt-4"
                  >
                    Continue Chatting
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2 font-medium">
                    No conversations yet
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                    Start chatting with Eunoia to get personalized support!
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => navigate("/chat")}
                    className="w-full"
                  >
                    Start Chatting Now
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Education Highlights */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-400" />
            Education Highlights
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {educationTopics.map((topic, index) => (
              <motion.div
                key={topic.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <Card className="dark:bg-gray-800/90 dark:border-gray-700 cursor-pointer h-full">
                  <div className="text-4xl mb-3">{topic.icon}</div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{topic.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Learn more about this topic
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/education")}
                    className="text-xs p-2 h-auto"
                  >
                    Read More <ArrowRight className="w-3 h-3 ml-1 inline" />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Reminders */}
        <Card className="dark:bg-gray-800/90 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 flex items-center justify-center flex-shrink-0">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Cycle Reminder</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Your next period is expected in {daysUntilPeriod} days. Don't forget to track your symptoms!
              </p>
              <Button
                variant="secondary"
                onClick={() => navigate("/track-cycle")}
                className="text-sm"
              >
                Set Reminders
              </Button>
            </div>
          </div>
        </Card>

        {/* Motivational Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-6"
        >
          <Heart className="w-6 h-6 text-rose-400 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400 italic">
            "Your body is amazing. Take care of it, listen to it, and honor it every day." 💕
          </p>
        </motion.div>
      </div>

      {/* Mood Message Popup */}
      <AnimatePresence>
        {showMoodMessage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoodMessage(false)}
              className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl border border-pink-100/50 dark:border-gray-700 pointer-events-auto">
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">{selectedMood}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        How you're feeling
                      </h3>
                      <button
                        onClick={() => setShowMoodMessage(false)}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {moodMessage}
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setShowMoodMessage(false);
                        navigate("/chat");
                      }}
                      className="mt-4 w-full"
                    >
                      Chat with Eunoia
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;

