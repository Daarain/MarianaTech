"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_FILE_SIZE_BYTES = exports.SUPPORTED_SONAR_EXTENSIONS = void 0;
exports.validateFileMetadata = validateFileMetadata;
exports.deriveMimeType = deriveMimeType;
exports.calculateBufferChecksum = calculateBufferChecksum;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
exports.SUPPORTED_SONAR_EXTENSIONS = [
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
exports.MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB default max limit
function validateFileMetadata(fileName, size, mimeTypeInput) {
    const ext = path_1.default.extname(fileName).toLowerCase().replace('.', '');
    const format = ext || 'unknown';
    if (size > exports.MAX_FILE_SIZE_BYTES) {
        return {
            isValid: false,
            format,
            mimeType: mimeTypeInput || 'application/octet-stream',
            error: `File size (${(size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of ${exports.MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`,
        };
    }
    if (ext && !exports.SUPPORTED_SONAR_EXTENSIONS.includes(ext)) {
        return {
            isValid: false,
            format,
            mimeType: mimeTypeInput || 'application/octet-stream',
            error: `Unsupported file extension '.${ext}'. Supported formats: ${exports.SUPPORTED_SONAR_EXTENSIONS.join(', ')}`,
        };
    }
    return {
        isValid: true,
        format,
        mimeType: mimeTypeInput || deriveMimeType(format),
    };
}
function deriveMimeType(format) {
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
function calculateBufferChecksum(buffer) {
    return crypto_1.default.createHash('sha256').update(buffer).digest('hex');
}
