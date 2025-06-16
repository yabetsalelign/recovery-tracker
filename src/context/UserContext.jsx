import React, { createContext, useState } from "react";
import { useEffect } from "react"
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [name, setName] = useState(localStorage.getItem("userName") || "");

  useEffect(() => {
    localStorage.setItem("userName", name);
  }, [name]);

  return (
    <UserContext.Provider value={{ name, setName }}>
      {children}
    </UserContext.Provider>
  );
};