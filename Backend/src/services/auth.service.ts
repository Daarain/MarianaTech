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
    role: UserRole;
  };
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

  return {
    user: user.name,
    role: user.role,
    token,
  };
}

export async function registerUser(
  nameInput: string,
  usernameInput: string,
  passwordInput: string,
  roleInput?: UserRole
): Promise<RegisterResponse> {
  const name = nameInput ? nameInput.trim() : '';
  const username = usernameInput ? usernameInput.trim().toLowerCase() : '';
  const password = passwordInput ?? '';
  const requestedRole = roleInput === 'admin' ? 'admin' : 'operator';

  if (!name || !username || !password) {
    throw new Error('Name, username, and password are required');
  }

  if (username.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new Error('Username already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    username,
    passwordHash,
    role: requestedRole,
    isActive: true,
  });

  return {
    message: 'User registered successfully',
    user: {
      name: user.name,
      username: user.username,
      role: user.role,
    },
  };
}

export async function getUserProfile(userId: string): Promise<IUser> {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }
  return user;
}
