import React from "react";

export const Separator = ({ className = "", orientation = "horizontal" }) => {
  return (
    <div
      className={
        orientation === "horizontal"
          ? `h-px w-full bg-gradient-to-r from-transparent via-pink-200 to-transparent ${className}`
          : `w-px h-full bg-gradient-to-b from-transparent via-pink-200 to-transparent ${className}`
      }
    />
  );
};

