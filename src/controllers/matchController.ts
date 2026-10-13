import { Response } from 'express';
import { PrismaClient, IniciadoPor } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware'; // Importa a tipagem customizada

const prisma = new PrismaClient();

export const criarInteresse = async (req: AuthRequest, res: Response) => {
    try {
        const { id_startup, id_investidor, iniciado_por, mensagem } = req.body;

        // req.usuarioId vem do middleware de autenticação
        if (!req.usuarioId) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const novoInteresse = await prisma.interesse.create({
            data: {
                id_startup,
                id_investidor,
                iniciado_por: iniciado_por as IniciadoPor,
                mensagem
            }
        });

        res.status(201).json({ message: 'Interesse enviado!', interesse: novoInteresse });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Interesse já registrado anteriormente.' });
        }
        res.status(500).json({ error: 'Erro interno ao processar interesse.' });
    }
};