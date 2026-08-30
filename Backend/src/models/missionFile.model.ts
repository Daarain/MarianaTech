import { Schema, model, Document } from 'mongoose';

export type StorageProviderType = 'local' | 'minio' | 's3';
export type UploadStatusType = 'pending' | 'uploading' | 'completed' | 'failed';
export type ValidationStatusType = 'pending' | 'valid' | 'invalid';

export interface IMissionFileDoc extends Document {
  missionId: string;
  fileName: string;
  originalFileName: string;
  size: number;
  format: string;
  mimeType: string;
  checksum?: string;
  storageProvider: StorageProviderType;
  storagePath: string;
  uploadStatus: UploadStatusType;
  validationStatus: ValidationStatusType;
  createdAt: Date;
  updatedAt: Date;
}

const MissionFileSchema = new Schema<IMissionFileDoc>(
  {
    missionId: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    originalFileName: { type: String, required: true },
    size: { type: Number, required: true },
    format: { type: String, required: true },
    mimeType: { type: String, required: true },
    checksum: { type: String, default: '' },
    storageProvider: {
      type: String,
      enum: ['local', 'minio', 's3'],
      default: 'local',
      required: true,
    },
    storagePath: { type: String, required: true },
    uploadStatus: {
      type: String,
      enum: ['pending', 'uploading', 'completed', 'failed'],
      default: 'pending',
      required: true,
    },
    validationStatus: {
      type: String,
      enum: ['pending', 'valid', 'invalid'],
      default: 'pending',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        return {
          id: ret._id.toString(),
          missionId: ret.missionId,
          fileName: ret.fileName,
          originalFileName: ret.originalFileName,
          size: ret.size,
          format: ret.format,
          mimeType: ret.mimeType,
          checksum: ret.checksum || null,
          storageProvider: ret.storageProvider,
          storagePath: ret.storagePath,
          uploadStatus: ret.uploadStatus,
          validationStatus: ret.validationStatus,
          createdAt: ret.createdAt,
          updatedAt: ret.updatedAt,
        };
      },
    },
  }
);

export const MissionFileModel = model<IMissionFileDoc>('MissionFile', MissionFileSchema);
