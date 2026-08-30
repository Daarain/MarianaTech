import { Schema, model, Document } from 'mongoose';

export interface IReport extends Document {
  mission_id: string;
  report_name: string;
  format: 'csv' | 'json' | 'pdf';
  file_path: string;
  file_size_bytes?: number;
  generated_by?: Schema.Types.ObjectId;
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    mission_id: { type: String, required: true, index: true },
    report_name: { type: String, required: true },
    format: { type: String, enum: ['csv', 'json', 'pdf'], required: true },
    file_path: { type: String, required: true },
    file_size_bytes: { type: Number, default: 0 },
    generated_by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Report = model<IReport>('Report', ReportSchema);
