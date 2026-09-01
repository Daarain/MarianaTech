import { Schema, model, Document } from 'mongoose';

export type UserRole = 'admin' | 'operator';

export interface IUser extends Document {
  name: string;
  username: string;
  email?: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  licenseImage?: {
    fileName: string;
    storagePath: string;
    mimeType: string;
    uploadedAt: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'operator'],
      default: 'operator',
      required: true,
    },
    isActive: { type: Boolean, default: true, required: true },
    licenseImage: {
      fileName: { type: String, default: null },
      storagePath: { type: String, default: null },
      mimeType: { type: String, default: null },
      uploadedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).passwordHash;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

export const User = model<IUser>('User', UserSchema);
