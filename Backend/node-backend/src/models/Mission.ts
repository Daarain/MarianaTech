import { Schema, model, Document } from 'mongoose';

export type MissionStatus = 'processing' | 'complete' | 'failed' | 'pending';
export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface IMission extends Document {
  id: string; // MSN-YYYY-XXXX format
  name: string;
  date: string;
  vessel?: string;
  location: string;
  latitude: number;
  longitude: number;
  status: MissionStatus;
  anomaly_count: number;
  priority: Priority;
  depth_m: number;
  depth_min?: number;
  depth_max?: number;
  area_km2: number;
  operator: string;
  sonar_type: string;
  notes?: string;
  created_by?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MissionSchema = new Schema<IMission>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    date: { type: String, required: true },
    vessel: { type: String, default: '' },
    location: { type: String, required: true },
    latitude: { type: Number, required: true, default: 0 },
    longitude: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['processing', 'complete', 'failed', 'pending'],
      default: 'pending',
    },
    anomaly_count: { type: Number, default: 0 },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    depth_m: { type: Number, required: true, default: 0 },
    depth_min: { type: Number, default: 0 },
    depth_max: { type: Number, default: 0 },
    area_km2: { type: Number, default: 10 },
    operator: { type: String, required: true },
    sonar_type: { type: String, required: true },
    notes: { type: String, default: '' },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Mission = model<IMission>('Mission', MissionSchema);
