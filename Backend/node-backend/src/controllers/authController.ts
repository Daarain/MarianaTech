import { Request, Response, NextFunction } from 'express';
import { loginUser } from '../services/authService';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    const result = await loginUser(username, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Authentication failed' });
  }
}

export async function logout(_req: Request, res: Response) {
  res.json({ message: 'Logged out successfully' });
}
