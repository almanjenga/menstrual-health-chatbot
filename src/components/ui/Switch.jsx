import React from "react";
import { motion } from "framer-motion";

export const Switch = ({ checked, onCheckedChange, label, className = "" }) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mr-3">
          {label}
        </label>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 ${
          checked ? "bg-gradient-to-r from-rose-400 to-pink-400" : "bg-gray-300"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
};

