import { BASE_URL } from '@/constants/config';
import { getStoredAuth } from './auth';

export class APIError extends Error {
  statusCode: number;
  code?: string;
  retryAfter?: number;

  constructor(message: string, statusCode: number, code?: string, retryAfter?: number) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function requestClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = 15000, headers: customHeaders, body, ...customOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const auth = getStoredAuth();
  const headers: Record<string, string> = {
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (!(body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth?.token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${auth.token}`;
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  try {
    const res = await fetch(url, {
      ...customOptions,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorData: any = null;
      try {
        errorData = await res.json();
      } catch {
        // Fallback if response is not JSON
      }

      const status = res.status;
      const message =
        errorData?.error?.message ||
        (typeof errorData?.error === 'string' ? errorData.error : null) ||
        errorData?.message ||
        `HTTP Error ${status}`;

      const code = errorData?.error?.code || errorData?.code || 'UNKNOWN_ERROR';
      const retryAfter = errorData?.error?.retryAfter;

      if (status === 401) {
        localStorage.removeItem('marianatech_auth');
        throw new APIError('Session expired. Please log in again.', 401, 'UNAUTHORIZED');
      }

      if (status === 403) {
        throw new APIError('Forbidden: Insufficient permissions.', 403, 'FORBIDDEN');
      }

      if (status === 404) {
        throw new APIError(message || 'Resource not found.', 404, 'NOT_FOUND');
      }

      if (status === 409) {
        throw new APIError(message || 'Resource conflict.', 409, code || 'PROCESSING_ALREADY_ACTIVE');
      }

      if (status === 422) {
        throw new APIError(message || 'Unprocessable entity.', 422, 'UNPROCESSABLE_ENTITY');
      }

      if (status === 429) {
        throw new APIError(
          message || 'Rate limit exceeded. Please try again later.',
          429,
          'RATE_LIMIT_EXCEEDED',
          retryAfter
        );
      }

      if (status >= 500) {
        throw new APIError('Server error. Please try again later.', status, 'SERVER_ERROR');
      }

      throw new APIError(message, status, code);
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return {} as T;
    }

    return (await res.json()) as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err instanceof APIError) {
      throw err;
    }
    if (err.name === 'AbortError') {
      throw new APIError('Request timed out. Please check your connection.', 408, 'TIMEOUT');
    }
    throw new APIError(err.message || 'Network error.', 500, 'NETWORK_ERROR');
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    requestClient<T>(endpoint, { method: 'GET', ...options }),

  post: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    requestClient<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    requestClient<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    requestClient<T>(endpoint, { method: 'DELETE', ...options }),
};
