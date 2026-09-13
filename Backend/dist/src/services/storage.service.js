"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = exports.StorageService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class StorageService {
    get provider() {
        const p = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
        if (p === 'minio')
            return 'minio';
        if (p === 's3')
            return 's3';
        return 'local';
    }
    async saveFile(missionId, originalFileName, buffer) {
        const provider = this.provider;
        if (provider === 'local') {
            const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'missions', missionId);
            if (!fs_1.default.existsSync(uploadDir)) {
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
            }
            const timestamp = Date.now();
            const safeName = `${timestamp}_${originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const fullPath = path_1.default.join(uploadDir, safeName);
            await fs_1.default.promises.writeFile(fullPath, buffer);
            const relativePath = path_1.default.relative(process.cwd(), fullPath).replace(/\\/g, '/');
            return {
                storageProvider: 'local',
                storagePath: relativePath,
            };
        }
        if (provider === 'minio' || provider === 's3') {
            // Abstracted object storage path identifier
            const bucketName = process.env.STORAGE_BUCKET || 'marianatech-sonar-files';
            const key = `missions/${missionId}/${Date.now()}_${originalFileName}`;
            return {
                storageProvider: provider,
                storagePath: `${bucketName}/${key}`,
            };
        }
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
}
exports.StorageService = StorageService;
exports.storageService = new StorageService();
