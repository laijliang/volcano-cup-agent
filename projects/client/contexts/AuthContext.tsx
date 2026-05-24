import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { Platform } from "react-native";

// ── 跨平台 token 存储 ──

const storage = {
  getToken(): string | null {
    if (Platform.OS === "web") {
      return localStorage.getItem("auth_token");
    }
    // native 端用内存变量（后续可替换为 expo-secure-store）
    return (globalThis as any).__auth_token || null;
  },
  setToken(token: string) {
    if (Platform.OS === "web") {
      localStorage.setItem("auth_token", token);
    } else {
      (globalThis as any).__auth_token = token;
    }
  },
  removeToken() {
    if (Platform.OS === "web") {
      localStorage.removeItem("auth_token");
    } else {
      delete (globalThis as any).__auth_token;
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
    const savedToken = storage.getToken();
    if (savedToken) {
      setToken(savedToken);
      // 用 token 获取用户信息
      fetch(`${API_BASE}/api/v1/user/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((r) => r.json())
        .then((u) => {
          if (u.id) setUser(u);
          else storage.removeToken();
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (phone: string, name?: string) => {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name }),
    });
    if (!res.ok) throw new Error("登录失败");
    const data = await res.json();
    storage.setToken(data.token);
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
    storage.removeToken();
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
