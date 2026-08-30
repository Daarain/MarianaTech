import { Schema, model, Document } from 'mongoose';
import { Priority } from './Mission';

export type AnomalyStatus = 'pending_review' | 'verified' | 'rejected' | 'false_positive';
export type AnomalyClass =
  | 'unidentified_object'
  | 'shipwreck'
  | 'marine_life_cluster'
  | 'debris_field'
  | 'geological_formation'
  | 'pipeline_damage'
  | 'mine_like_contact';

export interface IAnomaly extends Document {
  id: string; // ANM-XXXX-YYY format
  mission_id: string;
  file_id?: Schema.Types.ObjectId;
  job_id?: Schema.Types.ObjectId;
  class_name: AnomalyClass;
  confidence: number;
  latitude: number;
  longitude: number;
  priority: Priority;
  status: AnomalyStatus;
  depth_m: number;
  detected_at: string;
  size_m: number;
  description: string;
  bounding_box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  tile_image_url?: string;
  ai_metadata?: {
    quality_score?: number;
    natural_vs_artificial?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AnomalySchema = new Schema<IAnomaly>(
  {
    id: { type: String, required: true, unique: true, index: true },
    mission_id: { type: String, required: true, index: true },
    file_id: { type: Schema.Types.ObjectId, ref: 'MissionFile' },
    job_id: { type: Schema.Types.ObjectId, ref: 'ProcessingJob' },
    class_name: {
      type: String,
      enum: [
        'unidentified_object',
        'shipwreck',
        'marine_life_cluster',
        'debris_field',
        'geological_formation',
        'pipeline_damage',
        'mine_like_contact',
      ],
      required: true,
    },
    confidence: { type: Number, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending_review', 'verified', 'rejected', 'false_positive'],
      default: 'pending_review',
    },
    depth_m: { type: Number, required: true },
    detected_at: { type: String, required: true },
    size_m: { type: Number, required: true },
    description: { type: String, required: true },
    bounding_box: {
      x: { type: Number },
      y: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    tile_image_url: { type: String },
    ai_metadata: {
      quality_score: { type: Number },
      natural_vs_artificial: { type: Number },
    },
  },
  { timestamps: true }
);

export const Anomaly = model<IAnomaly>('Anomaly', AnomalySchema);
