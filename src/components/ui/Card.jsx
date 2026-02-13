import React from "react";
import { motion } from "framer-motion";

export const Card = ({ children, className = "", ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-pink-100/50 dark:border-gray-700 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

