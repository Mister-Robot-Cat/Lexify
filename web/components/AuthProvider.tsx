"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { fetchApi } from "../lib/api";

interface User {
  id: number;
  telegram_id: number;
  language: string;
  ui_language: string;
  learning_language: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (initData: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("lexify_token");
      if (token) {
        try {
          const userData = await fetchApi("/users/me");
          setUser(userData);
        } catch (err) {
          localStorage.removeItem("lexify_token");
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (initData: string) => {
    try {
      const { access_token } = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ initData }),
      });
      localStorage.setItem("lexify_token", access_token);
      const userData = await fetchApi("/users/me");
      setUser(userData);
    } catch (err) {
      console.error("Login failed", err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("lexify_token");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
