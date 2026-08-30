import { Schema, model, Document } from 'mongoose';

export interface IProcessingJob extends Document {
  job_id: string;
  mission_id: string;
  file_id?: Schema.Types.ObjectId;
  status: 'queued' | 'active' | 'completed' | 'failed';
  stage: 'upload' | 'validate' | 'processing' | 'review' | 'complete';
  progress: number;
  model_name?: string;
  model_version?: string;
  started_at?: Date;
  completed_at?: Date;
  error_log?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProcessingJobSchema = new Schema<IProcessingJob>(
  {
    job_id: { type: String, required: true, unique: true, index: true },
    mission_id: { type: String, required: true, index: true },
    file_id: { type: Schema.Types.ObjectId, ref: 'MissionFile' },
    status: {
      type: String,
      enum: ['queued', 'active', 'completed', 'failed'],
      default: 'queued',
    },
    stage: {
      type: String,
      enum: ['upload', 'validate', 'processing', 'review', 'complete'],
      default: 'upload',
    },
    progress: { type: Number, default: 0 },
    model_name: { type: String, default: 'YOLOv8x-Sonar' },
    model_version: { type: String, default: 'v2.1' },
    started_at: { type: Date },
    completed_at: { type: Date },
    error_log: [{ type: String }],
  },
  { timestamps: true }
);

export const ProcessingJob = model<IProcessingJob>('ProcessingJob', ProcessingJobSchema);
