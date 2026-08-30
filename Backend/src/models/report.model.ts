import { Schema, model, Document } from 'mongoose';

export type ReportFormatType = 'json' | 'csv' | 'pdf';
export type ReportStatusType = 'completed' | 'generating' | 'failed';

export interface IReportDoc extends Document {
  reportId: string;
  missionId: string;
  format: ReportFormatType;
  storagePath: string;
  status: ReportStatusType;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReportDoc>(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    missionId: { type: String, required: true, index: true },
    format: {
      type: String,
      enum: ['json', 'csv', 'pdf'],
      default: 'csv',
      required: true,
    },
    storagePath: { type: String, required: true },
    status: {
      type: String,
      enum: ['completed', 'generating', 'failed'],
      default: 'completed',
      required: true,
    },
    createdBy: { type: String, default: 'system' },
  },
  {
    timestamps: true,
  }
);

export const ReportModel = model<IReportDoc>('Report', ReportSchema);
