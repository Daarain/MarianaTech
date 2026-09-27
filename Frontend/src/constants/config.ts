export const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
export const API_FALLBACK_URLS = [
  BASE_URL,
  import.meta.env.VITE_API_FALLBACK_URL || 'https://marianatech.onrender.com',
].filter((url, index, urls) => url && urls.indexOf(url) === index);
export const AI_BASE_URL = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000';
export const IS_DEV = import.meta.env.DEV;
export const AUTH_BYPASS =
  Boolean(import.meta.env.DEV) &&
  (import.meta.env.VITE_AUTH_BYPASS === 'true' || import.meta.env.AUTH_BYPASS === 'true');
