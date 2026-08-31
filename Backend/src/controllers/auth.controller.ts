import { Request, Response, NextFunction } from 'express';
import { loginUser, getUserProfile, registerUser } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = req.body;
    const result = await loginUser(username, password);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({
      error: error.message || 'Authentication failed',
      statusCode: 401,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, username, password, role } = req.body ?? {};
    const result = await registerUser(name, username, password, role);
    res.status(201).json(result);
  } catch (error: any) {
    const message = error.message || 'Registration failed';
    const statusCode = message.toLowerCase().includes('exists') || message.toLowerCase().includes('already') ? 409 : 400;
    res.status(statusCode).json({
      error: message,
      statusCode,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    message: 'Logged out successfully',
    timestamp: new Date().toISOString(),
  });
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized', statusCode: 401 });
      return;
    }
    const user = await getUserProfile(req.user.id);
    res.status(200).json({
      id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}
