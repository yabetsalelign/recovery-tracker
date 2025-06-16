import React from "react";

const Layout = ({ children }) => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <img
        src="/sunrise.jpg"
        alt="Sunrise"
        className="absolute inset-0 w-full h-full object-cover opacity-20 z-0"
      />
      {/* Fade overlay */}
      <div className="absolute inset-0 bg-white opacity-80 dark:bg-gray-900 dark:opacity-90 z-10"></div>
      {/* Main content */}
      <div className="relative z-20">{children}</div>
    </div>
  );
};

export default Layout;