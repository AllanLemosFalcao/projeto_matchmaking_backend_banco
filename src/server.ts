import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
// Cria um servidor HTTP nativo passando o Express
const httpServer = createServer(app); 
// Inicializa o WebSocket
const io = new Server(httpServer, {
    cors: { origin: "*" } // Em produção, restrinja para o domínio do seu front
});

app.use(cors());
app.use(express.json());

// Middleware para injetar o 'io' em todas as rotas (para usarmos no controller)
app.use((req, res, next) => {
    (req as any).io = io;
    next();
});

app.use('/api', routes);

// Configura as "salas" de chat pelo ID do match
io.on('connection', (socket) => {
    socket.on('entrar_conversa', (matchId) => {
        socket.join(matchId); // O usuário entra em uma sala exclusiva dessa conversa
    });
});

const PORT = process.env.PORT || 3000;

// IMPORTANTE: Mude app.listen para httpServer.listen
httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor rodando com TypeScript e WebSockets na porta ${PORT}`);
});