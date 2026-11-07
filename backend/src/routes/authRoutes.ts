import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import AuthController from '../controllers/authController.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan, coba lagi nanti' },
});

router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', AuthController.me);

export default router;
