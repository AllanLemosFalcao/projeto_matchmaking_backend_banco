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
        let matchesAtivos = 0;

        if (usuario.tipo_usuario === 'startup' && usuario.startup) {
            // Todos que a startup enviou (histórico de esforço)
            enviados = await prisma.interesse.count({
                where: { id_startup: usuario.startup.id_startup, iniciado_por: 'startup' }
            });
            // Apenas os pendentes aguardando resposta da startup
            recebidos = await prisma.interesse.count({
                where: { id_startup: usuario.startup.id_startup, iniciado_por: 'investidor', status: 'pendente' }
            });
            // Conta os matches reais na tabela match_conexao
            matchesAtivos = await prisma.match_conexao.count({
                where: { id_startup: usuario.startup.id_startup, status: 'ativo' }
            });
        } 
        else if (usuario.tipo_usuario === 'investidor' && usuario.investidor) {
            enviados = await prisma.interesse.count({
                where: { id_investidor: usuario.investidor.id_investidor, iniciado_por: 'investidor' }
            });
            recebidos = await prisma.interesse.count({
                where: { id_investidor: usuario.investidor.id_investidor, iniciado_por: 'startup', status: 'pendente' }
            });
            matchesAtivos = await prisma.match_conexao.count({
                where: { id_investidor: usuario.investidor.id_investidor, status: 'ativo' }
            });
        }

        res.json({
            interessesEnviados: enviados,
            interessesRecebidos: recebidos,
            matches: matchesAtivos
        });

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        res.status(500).json({ error: 'Erro interno ao carregar estatísticas' });
    }
};