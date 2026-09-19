import { BASE_URL } from '@/constants/config';
import type { ApiResponse } from '@/types/api';

export class APIClientError extends Error {
  code: string;
  details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'APIClientError';
    this.code = code;
    this.details = details;
  }
}

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const timeoutMs = options.timeoutMs || 30000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!headers['Authorization'] && typeof window !== 'undefined') {
    try {
      const authUser = localStorage.getItem('marianatech_auth_user');
      let token: string | null = null;
      if (authUser) {
        try {
          const parsed = JSON.parse(authUser);
          token = parsed?.token || null;
        } catch {}
      }
      if (!token) {
        token = localStorage.getItem('marianatech_auth') || localStorage.getItem('token');
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {}
  }

  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';

    // 1. Handle Binary/CSV streams directly
    if (contentType.includes('text/csv') || contentType.includes('application/octet-stream')) {
      if (!res.ok) {
        throw new APIClientError(`HTTP_${res.status}`, `Report download failed with status ${res.status}`);
      }
      const blob = await res.blob();
      return blob as unknown as T;
    }

    // 2. Safe Parsing JSON vs Non-JSON
    let rawText = '';
    let payload: ApiResponse<T> | null = null;

    try {
      rawText = await res.text();
      if (rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
        payload = JSON.parse(rawText);
      }
    } catch {
      payload = null;
    }

    // 3. Check Response Status
    if (!res.ok) {
      let message = '';
      let code = `HTTP_${res.status}`;
      let details: any = rawText || null;

      if (payload && typeof payload === 'object') {
        const p = payload as any;
        if (p.error) {
          if (typeof p.error === 'string') {
            message = p.error;
          } else if (typeof p.error === 'object') {
            message = p.error.message || '';
            code = p.error.code || code;
            details = p.error.details ?? p;
          }
        } else if (typeof p.message === 'string') {
          message = p.message;
        }

        if (p.statusCode) {
          code = String(p.statusCode);
        }
      }

      // Map HTTP error codes to user-friendly messages if no specific message was extracted
      if (!message) {
        if (res.status === 400) message = 'Invalid request parameters provided.';
        else if (res.status === 401) message = 'Invalid credentials or session expired.';
        else if (res.status === 403) message = 'Access denied: insufficient clearance permissions.';
        else if (res.status === 404) message = 'The requested telemetry resource was not found.';
        else if (res.status === 409) message = 'Conflict detected: account or identifier already exists.';
        else if (res.status === 413) message = 'Uploaded sonar file exceeds maximum allowable size (50 MB limit).';
        else if (res.status === 415) message = 'Unsupported file format. Please upload a valid PNG, JPG, BMP, or TIFF sonar image.';
        else if (res.status === 422) message = 'Uploaded image file is corrupted or contains unprocessable pixel data.';
        else if (res.status === 429) message = 'Too many requests. Please wait a moment before trying again.';
        else if (res.status === 500) message = 'An unexpected server error occurred during sonar processing.';
        else if (res.status === 502 || res.status === 503) message = 'MarianaTech AI processing service is currently unavailable.';
        else message = `Request failed with status ${res.status}`;
      }

      throw new APIClientError(code, message, details);
    }

    // 4. Handle Explicit Failure Envelopes (e.g. { success: false, error: ... })
    if (payload && typeof payload === 'object' && 'success' in payload && (payload as any).success === false) {
      const p = payload as any;
      const err = p.error;
      const message = typeof err === 'string'
        ? err
        : err?.message || p.message || 'The requested operation failed.';
      const code = typeof err === 'object' && err?.code ? err.code : `HTTP_${res.status}`;
      throw new APIClientError(code, message, err?.details || p);
    }

    // 5. Envelope Response: { success: true, data: ... }
    if (payload && typeof payload === 'object' && 'success' in payload && (payload as any).success === true && 'data' in payload) {
      return (payload as any).data as T;
    }

    // 6. Direct JSON payload (e.g. { user, role, token }, arrays, etc.)
    if (payload !== null && payload !== undefined) {
      return payload as unknown as T;
    }

    if (!rawText.trim()) {
      return undefined as unknown as T;
    }

    throw new APIClientError('INVALID_RESPONSE', 'API returned unexpected non-JSON response payload.', rawText);
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error instanceof APIClientError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new APIClientError(
        'REQUEST_TIMEOUT',
        `Request timed out after ${Math.round(timeoutMs / 1000)} seconds. The sonar service took too long to respond.`
      );
    }

    // Handle network disconnection or server offline
    throw new APIClientError(
      'SERVER_UNAVAILABLE',
      `Backend API server is unreachable at ${BASE_URL}. Please verify your network connection and server status.`,
      error?.message
    );
  }
}
