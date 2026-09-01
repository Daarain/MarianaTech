import { Router } from 'express';
import multer from 'multer';
import { login, logout, getMe, register, registerAdmin } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);
router.post('/signup', authLimiter, register);
router.post('/register-admin', authLimiter, upload.single('licenseImage'), registerAdmin);
router.post('/signup-admin', authLimiter, upload.single('licenseImage'), registerAdmin);
router.post('/logout', logout);
router.get('/me', authenticateJWT, getMe);

export default router;
