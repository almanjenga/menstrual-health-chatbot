import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./Config";

const WelcomePage = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const features = [
    { icon: "💬", title: "Safe Space", desc: "Confidential & supportive" },
    { icon: "🌸", title: "Expert Guidance", desc: "Evidence-based answers" },
    { icon: "🌍", title: "Bilingual", desc: "English & Kiswahili" },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setCheckingAuth(false);
      // If user is logged in, redirect to home page
      if (currentUser) {
        navigate("/home");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/40 via-purple-50/30 to-pink-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-rose-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50/40 via-purple-50/30 to-pink-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-6 relative overflow-hidden">
      
      {/* Subtle Background Elements */}
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

      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-8 sm:p-12 shadow-lg w-full max-w-2xl border border-pink-100/50 dark:border-gray-700 z-10"
      >
        {/* Hero Image */}
        <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden shadow-2xl shadow-primary/20 mb-6">
          <img
            src="https://images.unsplash.com/photo-1580713864129-e9d157c6b63d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1pbmluZSUyMGlsbHVzdHJhdGlvbiUyMHBhc3RlbHxlbnwxfHx8fDE3NjM0OTQ4OTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Eunoia illustration"
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-br from-rose-100/30 via-transparent to-violet-100/30" />
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl font-semibold mb-2 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Welcome to Eunoia
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-lg sm:text-xl text-gray-700 dark:text-gray-200 font-normal leading-relaxed"
          >
            Your safe space to learn, ask, and chat about menstrual health —{" "}
            <span className="text-rose-700 dark:text-rose-300 font-medium">judgment-free</span>,{" "}
            <span className="text-pink-700 dark:text-pink-300 font-medium">inclusive</span>, and{" "}
            <span className="text-purple-700 dark:text-purple-300 font-medium">culturally sensitive</span>.
          </motion.p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/login")}
            className="rounded-lg px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium shadow-md hover:from-rose-600 hover:to-pink-600 hover:shadow-lg transition-all duration-200 w-full sm:w-auto"
          >
            Login
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/signup")}
            className="rounded-lg px-8 py-3 border border-rose-300 dark:border-rose-600 text-rose-700 dark:text-rose-300 font-medium bg-white dark:bg-gray-800 hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-gray-700 transition-all duration-200 w-full sm:w-auto"
          >
            Sign Up
          </motion.button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
          {features.map((feature, i) => (
            <div key={i} className="bg-gradient-to-br from-rose-50/50 to-pink-50/40 dark:from-gray-700/50 dark:to-gray-600/40 backdrop-blur-sm p-5 rounded-xl border border-rose-200/30 dark:border-gray-600 hover:border-rose-300/50 dark:hover:border-gray-500 hover:shadow-md transition-all text-center">
              <div className="text-3xl mb-2">{feature.icon}</div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200">{feature.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{feature.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-10 text-sm sm:text-base text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-2 z-10"
      >
        <Heart className="w-4 h-4 text-rose-400" />
        <span>Made with care to support menstrual health awareness</span>
      </motion.p>
    </div>
  );
};

export default WelcomePage;
