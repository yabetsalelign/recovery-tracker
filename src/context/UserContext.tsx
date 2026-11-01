import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { UserContextType } from "../types";

export const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [name, setName] = useState<string>(() => localStorage.getItem("userName") || "");

  useEffect(() => {
    localStorage.setItem("userName", name);
  }, [name]);

  return (
    <UserContext.Provider value={{ name, setName }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
