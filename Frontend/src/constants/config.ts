export const BASE_URL = import.meta.env.VITE_API_URL || 'https://marianatech.onrender.com';
// The AI service base URL is kept separate from the Node/MongoDB API.
// The request client appends `/detect` to this origin.
export const AI_BASE_URL =
  import.meta.env.VITE_AI_API_URL || '/api/ai';
export const IS_DEV = import.meta.env.DEV;
export const AUTH_BYPASS =
  Boolean(import.meta.env.DEV) &&
  (import.meta.env.VITE_AUTH_BYPASS === 'true' || import.meta.env.AUTH_BYPASS === 'true');
