import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FiSend, FiPlus, FiMessageSquare } from "react-icons/fi";
import { MessageCircle, Lock, X } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./Config";
import { useLanguage } from "./contexts/LanguageContext";
import { getTranslation } from "./utils/translations";

const ChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const lastHandledConversationIdRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load conversations list
  const loadConversations = async (user_id) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/chat/conversations?user_id=${user_id}`
      );
      const data = await response.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  // Load a specific conversation
  const loadConversation = async (user_id, conversation_id) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/chat/conversations/${conversation_id}?user_id=${user_id}`
      );
      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        const formattedMessages = data.messages.map((msg) => ({
          sender: msg.role === "User" ? "user" : "bot",
          text: msg.text,
          timestamp: msg.timestamp,
        }));
        setMessages(formattedMessages);
      } else {
        // Empty conversation, show greeting
        const userName = user?.displayName || user?.email?.split("@")[0];
        const capitalizedName = userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : "there";
        setMessages([
          {
            sender: "bot",
            text: getTranslation("greeting", language, { name: capitalizedName }),
          },
        ]);
      }
      setCurrentConversationId(conversation_id);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  // Create a new conversation
  const createNewConversation = async (user_id) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id }),
      });
      const data = await response.json();
      
      if (data.conversation_id) {
        // Set initial greeting message
        const userName = user?.displayName || user?.email?.split("@")[0];
        const capitalizedName = userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : "there";
        setMessages([
          {
            sender: "bot",
            text: getTranslation("greeting", language, { name: capitalizedName }),
          },
        ]);
        setCurrentConversationId(data.conversation_id);
        // Reload conversations list
        await loadConversations(user_id);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  // Handle navigation state changes (when clicking a conversation from HomePage)
  // This runs when location.state changes, which happens when navigating from HomePage
  useEffect(() => {
    const conversationIdFromState = location.state?.conversationId;
    
    // If we have a conversation_id from navigation and haven't handled this specific one yet
    if (conversationIdFromState && lastHandledConversationIdRef.current !== conversationIdFromState) {
      // Wait for user to be available if not yet set
      if (!user) {
        // User not yet loaded, wait for auth to complete
        return;
      }
      
      const loadConversationFromState = async () => {
        try {
          // Load conversations list first
          const response = await fetch(
            `http://127.0.0.1:5000/chat/conversations?user_id=${user.uid}`
          );
          const data = await response.json();
          const loadedConversations = data.conversations || [];
          setConversations(loadedConversations);
          
          const conversationExists = loadedConversations.find(
            conv => conv.conversation_id === conversationIdFromState
          );
          
          if (conversationExists) {
            await loadConversation(user.uid, conversationIdFromState);
            lastHandledConversationIdRef.current = conversationIdFromState;
            // Clear the state to avoid reloading on re-render
            navigate(location.pathname, { replace: true, state: {} });
          } else {
            // Conversation not found, clear the ref so we don't keep trying
            lastHandledConversationIdRef.current = null;
          }
        } catch (error) {
          console.error("Error loading conversation from state:", error);
          lastHandledConversationIdRef.current = null;
        }
      };
      
      loadConversationFromState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, user]);

  // Initialize: Load conversations and start new chat on login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setCheckingAuth(false);
      if (currentUser) {
        setUser(currentUser);
        const user_id = currentUser.uid;
        
        // Check if we have a conversation_id from navigation state
        const conversationIdFromState = location.state?.conversationId;
        
        // Load conversations list and check for empty conversation
        try {
          const response = await fetch(
            `http://127.0.0.1:5000/chat/conversations?user_id=${user_id}`
          );
          const data = await response.json();
          const loadedConversations = data.conversations || [];
          setConversations(loadedConversations);
          
          // If we have a conversation_id from navigation state, let the location.state useEffect handle it
          // Don't create a new conversation if we're navigating with a specific conversation
          if (conversationIdFromState) {
            // The location.state useEffect will handle loading this conversation
            // Just make sure we don't create a new one here - return early
            return;
          }
          
          // Only check for empty conversations if we don't have a conversationIdFromState
          // and we don't already have a currentConversationId set
          if (!currentConversationId) {
            // Check if there's an empty conversation (0 messages or only greeting)
            // First check conversations with 0 messages, then check those with 1 message (just greeting)
            const trulyEmptyConvs = loadedConversations.filter(conv => conv.message_count === 0);
            const greetingOnlyConvs = loadedConversations.filter(conv => conv.message_count === 1);
            
            // Combine both types of empty conversations
            const emptyConvs = [...trulyEmptyConvs, ...greetingOnlyConvs];
            
            if (emptyConvs.length > 0) {
              // Find the most recent empty conversation
              const sortedEmpty = emptyConvs.sort((a, b) => 
                new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
              );
              const emptyConvId = sortedEmpty[0].conversation_id;
              await loadConversation(user_id, emptyConvId);
            } else {
              // No empty conversation found, create a new one
              await createNewConversation(user_id);
            }
          }
        } catch (error) {
          console.error("Error loading conversations:", error);
          // Fallback: create a new conversation if loading fails
          await createNewConversation(user_id);
        }
      } else {
        setUser(null);
        setMessages([]);
        setConversations([]);
        setCurrentConversationId(null);
        lastHandledConversationIdRef.current = null;
      }
    });
    return () => unsubscribe();
  }, [language]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Reload conversations when a message is sent (to update titles)
  useEffect(() => {
    if (user && currentConversationId) {
      loadConversations(user.uid);
    }
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const userMessage = { sender: "user", text: newMessage };
    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = newMessage;
    setNewMessage("");
    setLoading(true);

    try {
      // Send user input to Flask backend with user_id, conversation_id, and language
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: messageToSend,
          user_id: user.uid,
          conversation_id: currentConversationId,
          language: language
        }),
      });

      const data = await response.json();

      const botReply = data.response || "💭 Sorry, I didn't quite get that.";

      // Update conversation_id if it was created
      if (data.conversation_id && !currentConversationId) {
        setCurrentConversationId(data.conversation_id);
      }

      console.log("Emotion:", data.emotion);
      console.log("Language:", data.language);

      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (error) {
      console.error("Error fetching from backend:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ I couldn't reach my brain right now. Try again later!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    if (user) {
      await createNewConversation(user.uid);
    }
  };

  const handleConversationClick = async (conversation_id) => {
    if (user && conversation_id !== currentConversationId) {
      await loadConversation(user.uid, conversation_id);
    }
  };

  const handleDeleteConversation = async (conversation_id) => {
    if (!user) return;
    
    // Confirm deletion
    if (!window.confirm("Are you sure you want to delete this conversation?")) {
      return;
    }
    
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/chat/conversations/${conversation_id}?user_id=${user.uid}`,
        {
          method: "DELETE",
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        // If deleted conversation was the current one, create a new conversation
        if (conversation_id === currentConversationId) {
          await createNewConversation(user.uid);
        }
        
        // Reload conversations list
        await loadConversations(user.uid);
      } else {
        console.error("Error deleting conversation:", data.error);
        alert("Failed to delete conversation. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("Failed to delete conversation. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
  };

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-pink-50/40 via-purple-50/30 to-pink-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-rose-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Show error message if user is not signed in
  if (!user) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-pink-50/40 via-purple-50/30 to-pink-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-pink-100/50 dark:border-gray-700 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mb-4"
          >
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-10 h-10 text-rose-500 dark:text-rose-400" />
            </div>
          </motion.div>
          
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Sign In Required
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You need to sign up or log in to chat with Eunoia. Create an account to start your journey with us! 💕
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/signup")}
              className="flex-1 rounded-lg px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium shadow-md hover:from-rose-600 hover:to-pink-600 hover:shadow-lg transition-all duration-200"
            >
              Sign Up
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/login")}
              className="flex-1 rounded-lg px-6 py-3 border border-rose-300 dark:border-rose-600 text-rose-700 dark:text-rose-300 font-medium bg-white dark:bg-gray-800 hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Login
            </motion.button>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/")}
            className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            ← Back to Home
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-gradient-to-br from-pink-50/40 via-purple-50/30 to-pink-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[5] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          width: sidebarOpen ? "280px" : "0px",
          x: sidebarOpen ? 0 : "-100%"
        }}
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-r border-gray-200/60 dark:border-gray-700 overflow-hidden flex flex-col transition-all duration-300 z-10 absolute md:relative h-full md:translate-x-0"
      >
        {sidebarOpen && (
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200/60 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3 md:mb-0">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 md:hidden">Conversations</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <button
                onClick={handleNewChat}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-400 to-pink-400 text-white rounded-lg hover:from-rose-500 hover:to-pink-500 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
              >
                <FiPlus className="h-4 w-4" />
                New Chat
              </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.conversation_id}
                    className="group relative"
                  >
                    <motion.button
                      onClick={() => handleConversationClick(conv.conversation_id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        currentConversationId === conv.conversation_id
                          ? "bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 text-rose-700 dark:text-rose-300 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-2">
                        <FiMessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {conv.title || "New Chat"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {formatDate(conv.updated_at)}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                    
                    {/* Delete button - appears on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.conversation_id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"
                      title="Delete conversation"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Chat Header */}
        <div className="px-4 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-b border-gray-200/60 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">
              {conversations.find(c => c.conversation_id === currentConversationId)?.title || "New Chat"}
            </h2>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-md ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-rose-400 to-pink-400 text-white rounded-br-none"
                    : "bg-gray-100/90 dark:bg-gray-700/90 backdrop-blur-sm text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-200/50 dark:border-gray-600/50"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100/90 dark:bg-gray-700/90 backdrop-blur-sm text-gray-800 dark:text-gray-100 px-4 py-2 rounded-2xl rounded-bl-none shadow-md animate-pulse border border-gray-200/50 dark:border-gray-600/50">
                {getTranslation("typing", language)}
              </div>
            </div>
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="px-4 pb-6 pt-2">
          <form
            onSubmit={handleSend}
            className="max-w-4xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/60 dark:border-gray-700 flex items-center gap-2 p-3 hover:shadow-2xl transition-shadow duration-200"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={getTranslation("messagePlaceholder", language)}
              className="flex-1 bg-transparent border-none focus:outline-none px-4 py-2 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-rose-400 to-pink-400 text-white rounded-xl p-2.5 hover:from-rose-500 hover:to-pink-500 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px]"
              disabled={loading || !newMessage.trim()}
            >
              <FiSend className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
