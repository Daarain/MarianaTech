import { Schema, model, Document } from 'mongoose';

export interface IVerificationHistoryDoc extends Document {
  anomalyId: string;
  user: string;
  timestamp: Date;
  decision: 'verified' | 'rejected' | 'false_positive' | string;
  comment: string;
  createdAt: Date;
}

const VerificationHistorySchema = new Schema<IVerificationHistoryDoc>(
  {
    anomalyId: { type: String, required: true, index: true },
    user: { type: String, required: true, default: 'Operator' },
    timestamp: { type: Date, default: Date.now, required: true },
    decision: { type: String, required: true },
    comment: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        return {
          id: ret._id.toString(),
          anomalyId: ret.anomalyId,
          user: ret.user,
          timestamp: ret.timestamp ? ret.timestamp.toISOString() : new Date().toISOString(),
          decision: ret.decision,
          comment: ret.comment || '',
          createdAt: ret.createdAt,
        };
      },
    },
  }
);

export const VerificationHistoryModel = model<IVerificationHistoryDoc>(
  'VerificationHistory',
  VerificationHistorySchema
);
