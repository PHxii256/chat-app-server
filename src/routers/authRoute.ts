import { Router } from 'express';
import AuthController from '../controllers/authController';
import { authenticateToken } from '../utils/jwt';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.post('/refresh-token', (req, res) => authController.refreshToken(req, res));

// Protected routes (require authentication)
router.post('/logout', authenticateToken, (req, res) => authController.logout(req, res));
router.post('/logout-all', authenticateToken, (req, res) => authController.logoutAll(req, res));
router.get('/profile', authenticateToken, (req, res) => authController.getProfile(req, res));

export default router;