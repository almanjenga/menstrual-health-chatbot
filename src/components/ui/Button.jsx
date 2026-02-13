import React from "react";
import { motion } from "framer-motion";

export const Button = ({ 
  children, 
  onClick, 
  variant = "primary", 
  className = "", 
  disabled = false,
  type = "button",
  ...props 
}) => {
  const baseStyles = "px-6 py-2.5 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-rose-400 to-pink-400 text-white hover:from-rose-500 hover:to-pink-500 shadow-md hover:shadow-lg",
    secondary: "border border-rose-200 dark:border-rose-700 text-rose-600 dark:text-rose-400 bg-white dark:bg-gray-800 hover:border-rose-300 dark:hover:border-rose-600 hover:bg-rose-50/50 dark:hover:bg-gray-700",
    danger: "bg-red-400 text-white hover:bg-red-500 shadow-md hover:shadow-lg",
    ghost: "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

