import React from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";

export const Avatar = ({ src, alt, name, size = "lg", className = "", emoji = null }) => {
  const sizes = {
    sm: "w-12 h-12 text-lg",
    md: "w-16 h-16 text-xl",
    lg: "w-24 h-24 text-2xl",
    xl: "w-32 h-32 text-3xl"
  };

  const emojiSizes = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-4xl",
    xl: "text-6xl"
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-white font-semibold shadow-lg border-4 border-white overflow-hidden ${className}`}
    >
      {emoji ? (
        <span className={emojiSizes[size]}>{emoji}</span>
      ) : src && src.trim() !== "" ? (
        <img src={src} alt={alt || name} className="w-full h-full object-cover" />
      ) : name ? (
        <span>{getInitials(name)}</span>
      ) : (
        <User className="w-1/2 h-1/2" />
      )}
    </motion.div>
  );
};

