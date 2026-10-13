import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

app.use(cors());
app.use(express.json());

// Aplica todas as rotas
app.use('/api', routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, (  ) => {
    console.log(`🚀 Servidor rodando com TypeScript na porta ${PORT}`);
});