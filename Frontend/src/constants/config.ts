export const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1';
export const IS_DEV = import.meta.env.DEV;
export const AUTH_BYPASS =
  Boolean(import.meta.env.DEV) &&
  (import.meta.env.VITE_AUTH_BYPASS === 'true' || import.meta.env.AUTH_BYPASS === 'true');

