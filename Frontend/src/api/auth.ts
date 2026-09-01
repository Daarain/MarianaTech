import { apiClient } from './client';

export type AuthUser = {
  user: string;
  role: 'admin' | 'operator';
  token: string;
};

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

export async function login(identifier: string, password: string): Promise<AuthUser> {
  const data = await apiClient.post<AuthUser>('/auth/login', {
    username: identifier,
    email: identifier,
    password,
  });
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  return data;
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: 'admin' | 'operator' = 'operator',
  username?: string
): Promise<{ message: string; user: { name: string; username: string; email?: string; role: 'admin' | 'operator' } }> {
  return apiClient.post('/auth/register', { name, email, username, password, role });
}

export async function registerAdmin(
  name: string,
  email: string,
  password: string,
  licenseImage: File,
  username?: string
): Promise<{
  message: string;
  user: { name: string; username: string; email?: string; role: 'admin' | 'operator' };
  licenseImage: { fileName: string; storagePath: string; status: string; verified: boolean; note: string };
}> {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('email', email);
  formData.append('password', password);
  if (username) formData.append('username', username);
  formData.append('licenseImage', licenseImage);

  return apiClient.post('/auth/register-admin', formData);
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
}
