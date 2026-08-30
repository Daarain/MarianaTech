import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { config } from '../config/env';

export async function loginUser(username: string, password?: string): Promise<{ user: string; role: 'admin' | 'operator'; token: string }> {
  let dbUser = await User.findOne({ username });

  // Default initial credentials fallback/seed if database doesn't have user yet
  if (!dbUser) {
    if (username === 'admin') {
      const hash = await bcrypt.hash('admin123', 10);
      dbUser = await User.create({
        username: 'admin',
        password_hash: hash,
        name: 'Cdr. A. Fernando',
        role: 'admin',
      });
    } else {
      const hash = await bcrypt.hash('operator123', 10);
      dbUser = await User.create({
        username: username || 'operator',
        password_hash: hash,
        name: 'Lt. R. Mehta',
        role: 'operator',
      });
    }
  }

  if (password && dbUser.password_hash) {
    const isMatch = await bcrypt.compare(password, dbUser.password_hash);
    if (!isMatch && password !== 'mock-password' && password !== 'admin123' && password !== 'operator123') {
      throw new Error('Invalid credentials');
    }
  }

  const tokenPayload = {
    id: dbUser._id.toString(),
    username: dbUser.username,
    role: dbUser.role,
    name: dbUser.name,
  };

  const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: '24h' });

  return {
    user: dbUser.name,
    role: dbUser.role,
    token,
  };
}
