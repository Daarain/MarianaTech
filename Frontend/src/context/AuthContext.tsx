import { createContext, useContext, useState, type ReactNode } from 'react';
import { type AuthUser, getStoredAuth } from '@/api/auth';

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuth());

  const value: AuthContextValue = {
    user,
    login: async (username: string, password: string) => {
      const { login } = await import('@/api/auth');
      const u = await login(username, password);
      setUser(u);
    },
    logout: async () => {
      const { logout } = await import('@/api/auth');
      await logout();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
