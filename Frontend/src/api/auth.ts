<<<<<<< HEAD
import { BASE_URL } from '@/constants/config';
import { apiClient } from './client';

=======
>>>>>>> 7c3109914c58eb0fd2cd188542afc46b97452ec0
export type AuthUser = {
  user: string;
  role: 'admin' | 'operator';
  token: string;
};

<<<<<<< HEAD
const AUTH_STORAGE_KEY = 'marianatech_auth';

export function getStoredAuth(): AuthUser | null {
  const saved = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

export function getAuthHeaders(): Record<string, string> {
  const auth = getStoredAuth();
  if (auth?.token) {
    return { Authorization: `Bearer ${auth.token}` };
  }
  return {};
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const data = await apiClient.post<AuthUser>('/auth/login', { username, password });
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  return data;
}

export async function logout(): Promise<void> {
  const auth = getStoredAuth();
  if (auth?.token) {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Best effort logout API call
    }
  }
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function getMe(): Promise<{ id: string; username: string; name: string; role: string } | null> {
  try {
    return await apiClient.get('/auth/me');
  } catch {
    return null;
  }
=======
export async function login(username: string, _password: string): Promise<AuthUser> {
  await new Promise((r) => setTimeout(r, 300)); // mock delay
  if (username === 'admin') {
    return { user: 'Cdr. A. Fernando', role: 'admin', token: 'mock-admin-token' };
  }
  return { user: 'Lt. R. Mehta', role: 'operator', token: 'mock-token' };
}

export async function logout(): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
>>>>>>> 7c3109914c58eb0fd2cd188542afc46b97452ec0
}
