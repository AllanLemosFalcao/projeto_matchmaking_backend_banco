import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';

const prisma = new PrismaClient();

export const obterDashboard = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.usuarioId) return res.status(401).json({ error: 'Não autorizado' });

        const usuario = await prisma.usuario.findUnique({
            where: { id_usuario: req.usuarioId },
            include: { startup: true, investidor: true }
        });

        if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

        let enviados = 0;
        let recebidos = 0;

        // Conta as estatísticas se for Startup
        if (usuario.tipo_usuario === 'startup' && usuario.startup) {
            enviados = await prisma.interesse.count({
                where: { id_startup: usuario.startup.id_startup, iniciado_por: 'startup' }
            });
            recebidos = await prisma.interesse.count({
                where: { id_startup: usuario.startup.id_startup, iniciado_por: 'investidor' }
            });
        } 
        // Conta as estatísticas se for Investidor
        else if (usuario.tipo_usuario === 'investidor' && usuario.investidor) {
            enviados = await prisma.interesse.count({
                where: { id_investidor: usuario.investidor.id_investidor, iniciado_por: 'investidor' }
            });
            recebidos = await prisma.interesse.count({
                where: { id_investidor: usuario.investidor.id_investidor, iniciado_por: 'startup' }
            });
        }

        // Retorna os dados prontos para o front-end
        res.json({
            interessesEnviados: enviados,
            interessesRecebidos: recebidos,
            matches: 0
        });

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        res.status(500).json({ error: 'Erro interno ao carregar estatísticas' });
    }
};