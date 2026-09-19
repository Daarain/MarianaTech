import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiFetch } from '@/api/client';

export type UserRole = 'admin' | 'operator';

export interface AuthUser {
  user: string;
  role: UserRole;
  token?: string;
}

export interface SignupData {
  name: string;
  username: string;
  email?: string;
  password: string;
  role?: UserRole;
}

interface SignupResponse {
  message: string;
  user: {
    name: string;
    username: string;
    email?: string;
    role: UserRole;
  };
  role: UserRole;
  token: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<AuthUser>;
  signup: (data: SignupData) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const STORAGE_KEY = 'marianatech_auth_user';
const TOKEN_KEY = 'marianatech_auth';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize authentication state from persistent storage on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.token) {
          setUserState(parsed);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setUser = useCallback((u: AuthUser | null) => {
    setUserState(u);
    if (u && u.token) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        localStorage.setItem(TOKEN_KEY, u.token);
      } catch {}
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
      } catch {}
    }
  }, []);

  const login = useCallback(async (identifier: string, password?: string): Promise<AuthUser> => {
    const trimmedIdentifier = identifier.trim();
    const result = await apiFetch<AuthUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: trimmedIdentifier,
        email: trimmedIdentifier,
        password: password || '',
      }),
    });

    if (result && result.token) {
      setUser(result);
      return result;
    }

    throw new Error('Authentication response did not return a valid session token');
  }, [setUser]);

  const signup = useCallback(async (data: SignupData): Promise<AuthUser> => {
    const result = await apiFetch<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name.trim(),
        username: data.username.trim(),
        email: data.email?.trim() || undefined,
        password: data.password,
        role: data.role || 'operator',
      }),
    });

    if (!result?.token || !result.user?.name || !result.role) {
      throw new Error('Registration response did not return a valid session token');
    }

    const session: AuthUser = {
      user: result.user.name,
      role: result.role,
      token: result.token,
    };
    setUser(session);
    return session;
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      setUser(null);
    }
  }, [setUser]);

  const value: AuthContextValue = {
    user,
    role: user?.role ?? 'operator',
    isAuthenticated: Boolean(user && user.token),
    isLoading,
    login,
    signup,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
