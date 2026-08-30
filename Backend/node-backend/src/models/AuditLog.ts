import { Schema, model, Document } from 'mongoose';

export interface IAuditLog extends Document {
  user_id?: Schema.Types.ObjectId;
  action: string;
  entity_type: 'Mission' | 'Anomaly' | 'Auth' | 'Report';
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entity_type: {
      type: String,
      enum: ['Mission', 'Anomaly', 'Auth', 'Report'],
      required: true,
    },
    entity_id: { type: String },
    details: { type: Schema.Types.Mixed },
    ip_address: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
