import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'operator';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, index: true },
    password_hash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['admin', 'operator'], default: 'operator' },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
