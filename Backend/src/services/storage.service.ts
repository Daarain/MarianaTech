import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { StorageProviderType } from '../models/missionFile.model';

export interface StorageSaveResult {
  storageProvider: StorageProviderType;
  storagePath: string;
}

export class StorageService {
  private get provider(): StorageProviderType {
    const p = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
    if (p === 'minio') return 'minio';
    if (p === 's3') return 's3';
    return 'local';
  }

  public async saveFile(
    missionId: string,
    originalFileName: string,
    buffer: Buffer
  ): Promise<StorageSaveResult> {
    const provider = this.provider;

    if (provider === 'local') {
      const uploadDir = path.join(process.cwd(), 'uploads', 'missions', missionId);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const timestamp = Date.now();
      const safeName = `${timestamp}_${originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const fullPath = path.join(uploadDir, safeName);

      await fs.promises.writeFile(fullPath, buffer);

      const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
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

export const storageService = new StorageService();
