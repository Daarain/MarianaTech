import { Schema, model, Document } from 'mongoose';

export type AnomalyClassType =
  | 'unidentified_object'
  | 'shipwreck'
  | 'marine_life_cluster'
  | 'debris_field'
  | 'geological_formation'
  | 'pipeline_damage'
  | 'mine_like_contact';

export type AnomalyStatusType =
  | 'pending_review'
  | 'verified'
  | 'rejected'
  | 'false_positive';

export type AnomalyPriorityType = 'critical' | 'high' | 'medium' | 'low';

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // ALWAYS [longitude, latitude]
}

export interface IAnomalyDoc extends Document {
  id: string; // ANM-YYYY-XXXX format or MongoDB _id string
  customId: string;
  missionId: string;
  processingRunId?: string;
  sourceFileId?: string;
  modelVersion?: string;
  className: AnomalyClassType;
  confidence: number;
  latitude: number | null;
  longitude: number | null;
  location?: GeoJSONPoint;
  priority: AnomalyPriorityType;
  status: AnomalyStatusType;
  depthM: number;
  detectedAt: Date;
  sizeM: number;
  description: string;
  boundingBox?: number[];
  isDemoData: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnomalySchema = new Schema<IAnomalyDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    customId: {
      type: String,
      default: function (this: any) {
        return this.id;
      },
    },
    missionId: {
      type: String,
      default: function (this: any) {
        return (this as any).mission_id || this.missionId;
      },
      index: true,
    },
    processingRunId: { type: String, index: true },
    sourceFileId: { type: String, index: true },
    modelVersion: { type: String },
    className: {
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
      default: function (this: any) {
        return (this as any).class_name || 'unidentified_object';
      },
      required: true,
    },
    confidence: { type: Number, required: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending_review', 'verified', 'rejected', 'false_positive'],
      default: 'pending_review',
      required: true,
    },
    depthM: {
      type: Number,
      default: function (this: any) {
        return (this as any).depth_m ?? 0;
      },
      required: true,
    },
    detectedAt: { type: Date, default: Date.now },
    sizeM: { type: Number, default: 0 },
    description: { type: String, default: '' },
    boundingBox: { type: [Number], default: undefined },
    isDemoData: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        return {
          id: ret.id || ret.customId || ret._id.toString(),
          mission_id: ret.missionId,
          class_name: ret.className,
          confidence: ret.confidence,
          latitude: ret.latitude !== undefined && ret.latitude !== null ? ret.latitude : null,
          longitude: ret.longitude !== undefined && ret.longitude !== null ? ret.longitude : null,
          priority: ret.priority,
          status: ret.status,
          depth_m: ret.depthM,
          detected_at: ret.detectedAt ? ret.detectedAt.toISOString() : new Date().toISOString(),
          size_m: ret.sizeM,
          description: ret.description,
        };
      },
    },
  }
);

// 2dsphere index for GeoJSON geospatial queries
AnomalySchema.index({ location: '2dsphere' });

export const AnomalyModel = model<IAnomalyDoc>('Anomaly', AnomalySchema);
