import { apiFetch, APIClientError } from './client';
import type { DetectionResult } from '@/types/api';
import { validateDetectionResult } from '@/utils/validationUtils';

const ALLOWED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'tiff', 'bmp']);
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB limit

export async function detectSonarImage(
  file: File,
  _latitude: number = -6.3,
  _longitude: number = 71.2
): Promise<DetectionResult> {
  // 1. Client-Side Pre-Validation
  if (!file || !(file instanceof File)) {
    throw new APIClientError('INVALID_FILE', 'No sonar dataset file selected for analysis.');
  }

  if (file.size === 0) {
    throw new APIClientError('EMPTY_FILE', 'Uploaded image file is empty (0 bytes).');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new APIClientError(
      'FILE_TOO_LARGE',
      `Sonar dataset file size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 50 MB maximum limit.`
    );
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new APIClientError(
      'UNSUPPORTED_FORMAT',
      `Unsupported file extension '.${ext}'. Allowed formats: PNG, JPG, JPEG, TIFF, BMP.`
    );
  }

  // 2. Submit API Request
  const formData = new FormData();
  formData.append('file', file);

  const rawResult = await apiFetch<DetectionResult>('/detect', {
    method: 'POST',
    body: formData,
    timeoutMs: 45000, // 45s ML inference timeout
  });

  // 3. Validate & Normalize Untrusted ML Model Output
  if (
    !rawResult ||
    typeof rawResult !== 'object' ||
    typeof rawResult.detected_object !== 'string' ||
    typeof rawResult.confidence !== 'number' ||
    typeof rawResult.message !== 'string'
  ) {
    throw new APIClientError(
      'INVALID_RESPONSE',
      'The detection service returned an incomplete analysis result.'
    );
  }

  return validateDetectionResult(rawResult, `MSN-LOCAL-${Date.now().toString().slice(-4)}`);
}
