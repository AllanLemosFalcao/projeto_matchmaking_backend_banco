import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { criarInteresse } from '../controllers/matchController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Rotas Públicas
router.post('/auth/register', register);
router.post('/auth/login', login);

// Rotas Privadas (Protegidas pelo middleware)
router.post('/match/interesse', authMiddleware, criarInteresse);

export default router;