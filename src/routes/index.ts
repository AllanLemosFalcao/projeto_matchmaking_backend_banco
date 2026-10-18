import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { buscarPerfis } from '../controllers/buscaController';
import { obterDashboard } from '../controllers/dashboardController';
import { criarInteresse, interessesPendentes, aceitarMatch, listarMatches } from '../controllers/matchController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { enviarMensagem, listarMensagens } from '../controllers/mensagemController';

const router = Router();

// Rotas Públicas
router.post('/auth/register', register);
router.post('/auth/login', login);

// Rotas Privadas
router.post('/buscar', authMiddleware, buscarPerfis);
router.get('/dashboard', authMiddleware, obterDashboard);

// Rotas de Matchmaking
router.post('/match/interesse', authMiddleware, criarInteresse);
router.get('/match/pendentes', authMiddleware, interessesPendentes);
router.post('/match/aceitar', authMiddleware, aceitarMatch);
router.get('/match/listar', authMiddleware, listarMatches);

// Rotas de Mensagens
router.post('/mensagens', authMiddleware, enviarMensagem);
router.get('/mensagens/:matchId', authMiddleware, listarMensagens);

export default router;