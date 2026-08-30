import { Schema, model, Document } from 'mongoose';

export interface IMissionFile extends Document {
  mission_id: string;
  filename: string;
  original_name: string;
  size_bytes: number;
  mime_type?: string;
  storage_path: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  error_message?: string;
  createdAt: Date;
}

const MissionFileSchema = new Schema<IMissionFile>(
  {
    mission_id: { type: String, required: true, index: true },
    filename: { type: String, required: true },
    original_name: { type: String, required: true },
    size_bytes: { type: Number, required: true },
    mime_type: { type: String },
    storage_path: { type: String, required: true },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'processed', 'failed'],
      default: 'uploaded',
    },
    error_message: { type: String },
  },
  { timestamps: true }
);

export const MissionFile = model<IMissionFile>('MissionFile', MissionFileSchema);
