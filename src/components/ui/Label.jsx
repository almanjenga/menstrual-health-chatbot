import React from "react";

export const Label = ({ htmlFor, children, className = "", ...props }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 mb-1.5 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};

