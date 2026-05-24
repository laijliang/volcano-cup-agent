import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { setAuthToken } from "@/services/api";

// ── 跨平台 token 存储（Native: SecureStore 持久化 + 内存兜底, Web: localStorage） ──

const TOKEN_KEY = "auth_token";

const storage = {
  async getToken(): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem(TOKEN_KEY);
    }
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  async setToken(token: string) {
    // 内存兜底：API 层同步读取
    setAuthToken(token);
    if (Platform.OS !== "web") {
      try {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } catch {
        // SecureStore 失败时仅依赖内存（API 层可工作，重启后需重新登录）
      }
    }
  },
  async removeToken() {
    setAuthToken(null);
    if (Platform.OS !== "web") {
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } catch {}
    }
  },
};

// ── 类型 ──

interface UserOut {
  id: string;
  name: string;
  avatar: string;
  level: number;
  exp: number;
}

interface AuthContextType {
  user: UserOut | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<UserOut>) => void;
}

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || "http://localhost:9091";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserOut | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化：检查是否有已存储的 token
  useEffect(() => {
    (async () => {
      const savedToken = await storage.getToken();
      if (savedToken) {
        setToken(savedToken);
        try {
          const res = await fetch(`${API_BASE}/api/v1/user/me`, {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          const u = await res.json();
          if (u.id) {
            setUser(u);
          } else {
            await storage.removeToken();
          }
        } catch {
          // token 可能已失效，静默处理
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (phone: string, name?: string) => {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name }),
    });
    if (!res.ok) throw new Error("登录失败");
    const data = await res.json();
    await storage.setToken(data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      await fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    await storage.removeToken();
    setToken(null);
    setUser(null);
  }, [token]);

  const updateUser = useCallback((userData: Partial<UserOut>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
