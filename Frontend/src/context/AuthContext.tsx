import { createContext, useContext, useState, type ReactNode } from 'react';
<<<<<<< HEAD
import { type AuthUser, getStoredAuth } from '@/api/auth';
=======
import { type AuthUser } from '@/api/auth';
>>>>>>> 7c3109914c58eb0fd2cd188542afc46b97452ec0

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
<<<<<<< HEAD
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuth());

  const value: AuthContextValue = {
    user,
    login: async (username: string, password: string) => {
      const { login } = await import('@/api/auth');
      const u = await login(username, password);
=======
  const [user, setUser] = useState<AuthUser | null>({
    user: 'Lt. R. Mehta',
    role: 'operator',
    token: 'mock-token',
  });

  const value: AuthContextValue = {
    user,
    login: async (username: string, _password: string) => {
      const { login } = await import('@/api/auth');
      const u = await login(username, _password);
>>>>>>> 7c3109914c58eb0fd2cd188542afc46b97452ec0
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
