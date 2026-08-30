import { Router } from 'express';
import { login, logout } from '../controllers/authController';
import { logAudit } from '../middlewares/audit';

const router = Router();

router.post('/login', logAudit('login', 'Auth'), login);
router.post('/logout', logAudit('logout', 'Auth'), logout);

export default router;
