import { Schema, model, Document } from 'mongoose';

export interface IVerification extends Document {
  anomaly_id: string;
  mission_id: string;
  user_id?: Schema.Types.ObjectId;
  previous_status: string;
  new_status: string;
  action: 'verify' | 'reject' | 'reset';
  verified_at: Date;
}

const VerificationSchema = new Schema<IVerification>(
  {
    anomaly_id: { type: String, required: true, index: true },
    mission_id: { type: String, required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    previous_status: { type: String, required: true },
    new_status: { type: String, required: true },
    action: { type: String, enum: ['verify', 'reject', 'reset'], required: true },
    verified_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Verification = model<IVerification>('Verification', VerificationSchema);
