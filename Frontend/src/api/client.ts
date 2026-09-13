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
    if (!res.ok || (payload && !payload.success)) {
      if (payload && payload.error) {
        throw new APIClientError(
          payload.error.code || `HTTP_${res.status}`,
          payload.error.message || `API request failed with status ${res.status}`,
          payload.error.details
        );
      }

      // Map HTTP error codes to user-friendly messages
      let message = res.statusText || `Request failed with status ${res.status}`;
      if (res.status === 413) message = 'Uploaded sonar file exceeds maximum allowable size (50 MB limit).';
      else if (res.status === 415) message = 'Unsupported file format. Please upload a valid PNG, JPG, BMP, or TIFF sonar image.';
      else if (res.status === 422) message = 'Uploaded image file is corrupted or contains unprocessable pixel data.';
      else if (res.status === 500) message = 'An unexpected server error occurred during sonar processing.';
      else if (res.status === 502 || res.status === 503) message = 'MarianaTech AI processing service is currently unavailable.';

      throw new APIClientError(`HTTP_${res.status}`, message, rawText || null);
    }

    if (payload && payload.success) {
      return payload.data as T;
    }

    // Direct JSON response without standard wrapper
    if (payload) {
      return payload as unknown as T;
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
