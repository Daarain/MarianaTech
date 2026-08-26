export type AuthUser = {
  user: string;
  role: 'admin' | 'operator';
  token: string;
};

export async function login(username: string, _password: string): Promise<AuthUser> {
  await new Promise((r) => setTimeout(r, 300)); // mock delay
  if (username === 'admin') {
    return { user: 'Cdr. A. Fernando', role: 'admin', token: 'mock-admin-token' };
  }
  return { user: 'Lt. R. Mehta', role: 'operator', token: 'mock-token' };
}

export async function logout(): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
}
