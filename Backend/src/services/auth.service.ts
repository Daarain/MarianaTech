import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/user.model';
import { config } from '../config/env';

export interface LoginResponse {
  user: string;
  role: UserRole;
  token: string;
}

export async function loginUser(usernameInput: string, passwordInput: string): Promise<LoginResponse> {
  const username = usernameInput ? usernameInput.trim().toLowerCase() : '';
  
  if (!username || !passwordInput) {
    throw new Error('Username and password are required');
  }

  const user = await User.findOne({ username, isActive: true });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(passwordInput, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  const payload = {
    id: user._id.toString(),
    username: user.username,
    name: user.name,
    role: user.role,
  };

  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  };

  const token = jwt.sign(payload, config.jwtSecret, options);

  // Exact frontend compatibility response
  return {
    user: user.name,
    role: user.role,
    token,
  };
}

export async function getUserProfile(userId: string): Promise<IUser> {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }
  return user;
}
