import { Schema, model, Document } from 'mongoose';

export type ProcessingRunStatusType = 'completed' | 'failed';

export interface IProcessingRunDoc extends Document {
  runId: string;
  jobId: string;
  missionId: string;
  modelVersion: string;
  preprocessingVersion: string;
  status: ProcessingRunStatusType;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProcessingRunSchema = new Schema<IProcessingRunDoc>(
  {
    runId: { type: String, required: true, unique: true, index: true },
    jobId: { type: String, required: true, index: true },
    missionId: { type: String, required: true, index: true },
    modelVersion: { type: String, required: true },
    preprocessingVersion: { type: String, default: 'v1.0' },
    status: {
      type: String,
      enum: ['completed', 'failed'],
      required: true,
    },
    startedAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date },
    error: { type: String },
  },
  {
    timestamps: true,
  }
);

export const ProcessingRunModel = model<IProcessingRunDoc>('ProcessingRun', ProcessingRunSchema);
