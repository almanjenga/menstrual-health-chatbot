import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
  const location = useLocation();
  
  // Don't show navbar on login and signup pages
  const hideNavbarPaths = ["/login", "/signup"];
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      {children}
    </>
  );
};

export default Layout;

