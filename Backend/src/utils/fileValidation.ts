import crypto from 'crypto';
import path from 'path';

export const SUPPORTED_SONAR_EXTENSIONS = [
  'xtf',
  'jsf',
  'sl2',
  'sl3',
  'dat',
  'raw',
  'tif',
  'tiff',
  'png',
  'jpg',
  'jpeg',
  'json',
];

export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB default max limit

export interface ValidationResult {
  isValid: boolean;
  format: string;
  mimeType: string;
  error?: string;
}

export function validateFileMetadata(fileName: string, size: number, mimeTypeInput?: string): ValidationResult {
  const ext = path.extname(fileName).toLowerCase().replace('.', '');
  const format = ext || 'unknown';

  if (size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      format,
      mimeType: mimeTypeInput || 'application/octet-stream',
      error: `File size (${(size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`,
    };
  }

  if (ext && !SUPPORTED_SONAR_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      format,
      mimeType: mimeTypeInput || 'application/octet-stream',
      error: `Unsupported file extension '.${ext}'. Supported formats: ${SUPPORTED_SONAR_EXTENSIONS.join(', ')}`,
    };
  }

  return {
    isValid: true,
    format,
    mimeType: mimeTypeInput || deriveMimeType(format),
  };
}

export function deriveMimeType(format: string): string {
  switch (format.toLowerCase()) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'tif':
    case 'tiff':
      return 'image/tiff';
    case 'json':
      return 'application/json';
    case 'xtf':
      return 'application/x-extended-triton-format';
    case 'jsf':
      return 'application/x-edgetech-jsf';
    case 'sl2':
    case 'sl3':
      return 'application/x-lowrance-sonar';
    default:
      return 'application/octet-stream';
  }
}

export function calculateBufferChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
