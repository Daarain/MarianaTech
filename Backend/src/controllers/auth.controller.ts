import { Request, Response, NextFunction } from 'express';
import { loginUser, getUserProfile, registerUser } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { storageService } from '../services/storage.service';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, email, password } = req.body ?? {};
    const identifier = username ?? email ?? '';
    const result = await loginUser(identifier, password);
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
    const { name, username, email, password, role } = req.body ?? {};
    const result = await registerUser({
      name,
      username,
      email,
      password,
      role,
    });
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

export async function registerAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { name, username, email, password } = req.body ?? {};
    if (!req.file) {
      res.status(400).json({ error: 'A ship license image is required', statusCode: 400 });
      return;
    }

    const fileExtension = (req.file.originalname.split('.').pop() || '').toLowerCase();
    if (!['png', 'jpg', 'jpeg'].includes(fileExtension)) {
      res.status(400).json({ error: 'Only PNG, JPG, and JPEG files are allowed for the license image', statusCode: 400 });
      return;
    }

    const saveResult = await storageService.saveFile('admin-license', req.file.originalname, req.file.buffer);
    const result = await registerUser({
      name,
      username,
      email,
      password,
      role: 'admin',
      licenseImage: {
        fileName: req.file.originalname,
        storagePath: saveResult.storagePath,
        mimeType: req.file.mimetype || 'image/jpeg',
        uploadedAt: new Date(),
      },
    });

    res.status(201).json({
      ...result,
      licenseImage: {
        fileName: req.file.originalname,
        storagePath: saveResult.storagePath,
        status: 'uploaded',
        verified: false,
        note: 'License image was received and stored. No OCR or official verification service is configured in this project.',
      },
    });
  } catch (error: any) {
    const message = error.message || 'Admin registration failed';
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
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}
