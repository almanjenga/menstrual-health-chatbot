import React from "react";

export const Input = ({ 
  label, 
  id, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  className = "",
  ...props 
}) => {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-2.5 bg-white/80 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent text-gray-800 placeholder-gray-400 ${className}`}
      {...props}
    />
  );
};

