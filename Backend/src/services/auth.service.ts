import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/user.model';
import { config } from '../config/env';

export interface LoginResponse {
  user: string;
  role: UserRole;
  token: string;
}

export interface RegisterResponse {
  message: string;
  user: {
    name: string;
    username: string;
    email?: string;
    role: UserRole;
  };
  role: UserRole;
  token: string;
}

export interface RegisterUserInput {
  name: string;
  username?: string;
  email?: string;
  password: string;
  role?: UserRole;
  licenseImage?: {
    fileName: string;
    storagePath: string;
    mimeType: string;
    uploadedAt?: Date;
  } | null;
}

function normalizeUsername(name: string, email?: string): string {
  const base = (usernameFromEmail(email) || name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ') 
    .trim()
    .replace(/\s+/g, '.');

  return base || 'user';
}

function usernameFromEmail(email?: string): string {
  if (!email) return '';
  const localPart = email.split('@')[0]?.trim();
  return localPart ? localPart.replace(/[^a-z0-9]+/gi, '.') : '';
}

export async function loginUser(identifierInput: string, passwordInput: string): Promise<LoginResponse> {
  const identifier = identifierInput ? identifierInput.trim() : '';

  if (!identifier || !passwordInput) {
    throw new Error('Username/email and password are required');
  }

  const normalizedIdentifier = identifier.toLowerCase();
  const user = await User.findOne({
    isActive: true,
    $or: [{ username: normalizedIdentifier }, { email: normalizedIdentifier }],
  });

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

  return {
    user: user.name,
    role: user.role,
    token,
  };
}

export async function registerUser({
  name,
  username,
  email,
  password,
  role,
  licenseImage,
}: RegisterUserInput): Promise<RegisterResponse> {
  const safeName = name ? name.trim() : '';
  const normalizedEmail = email ? email.trim().toLowerCase() : '';
  const providedUsername = username ? username.trim().toLowerCase() : '';
  const passwordValue = password ?? '';
  // Public signup strictly creates 'operator' accounts. Admin role requires verified licenseImage via admin registration portal.
  const requestedRole = (role === 'admin' && Boolean(licenseImage)) ? 'admin' : 'operator';

  if (!safeName || !passwordValue) {
    throw new Error('Name and password are required');
  }

  if (!providedUsername && !normalizedEmail) {
    throw new Error('Username or email is required');
  }

  const sanitizedProvidedUsername = providedUsername
    ? providedUsername.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.]+/g, '')
    : '';
  const generatedUsername = sanitizedProvidedUsername || normalizeUsername(safeName, normalizedEmail);
  const finalUsername = generatedUsername
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_.]+/g, sanitizedProvidedUsername ? '_' : '.')
    .replace(/\.{2,}/g, '.')
    .replace(/_+/g, '_')
    .replace(/^\.|\.$/g, '');

  if (finalUsername.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }

  if (passwordValue.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const existingUser = await User.findOne({
    isActive: true,
    $or: [{ username: finalUsername }, ...(normalizedEmail ? [{ email: normalizedEmail }] : [])],
  });

  if (existingUser) {
    if (existingUser.username === finalUsername) {
      throw new Error('Username already exists');
    }
    if (normalizedEmail && existingUser.email === normalizedEmail) {
      throw new Error('Email already exists');
    }
  }

  const passwordHash = await bcrypt.hash(passwordValue, 10);
  const user = await User.create({
    name: safeName,
    username: finalUsername,
    email: normalizedEmail || undefined,
    passwordHash,
    role: requestedRole,
    isActive: true,
    ...(licenseImage
      ? {
          licenseImage: {
            fileName: licenseImage.fileName,
            storagePath: licenseImage.storagePath,
            mimeType: licenseImage.mimeType,
            uploadedAt: licenseImage.uploadedAt || new Date(),
          },
        }
      : {}),
  });

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

  return {
    message: 'User registered successfully',
    user: {
      name: user.name,
      username: user.username,
      email: user.email || undefined,
      role: user.role,
    },
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
