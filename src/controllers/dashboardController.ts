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

// ==========================================
// OBTER DETALHES PARA O MODAL DO DASHBOARD
// ==========================================
export const obterDetalhesDashboard = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.usuarioId) return res.status(401).json({ error: 'Não autorizado' });

        const usuario = await prisma.usuario.findUnique({
            where: { id_usuario: req.usuarioId },
            include: { startup: true, investidor: true }
        });

        if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

        const isStartup = usuario.tipo_usuario === 'startup';
        const meuIdRelacional = isStartup ? usuario.startup?.id_startup : usuario.investidor?.id_investidor;

        // VALIDAÇÃO ADICIONADA: Garante ao TypeScript que a variável não é undefined
        if (!meuIdRelacional) {
            return res.status(400).json({ error: 'Perfil específico não encontrado' });
        }

        // Busca TODOS os interesses e matches com tipagem "as string"
        const interesses = await prisma.interesse.findMany({
            where: isStartup ? { id_startup: meuIdRelacional as string } : { id_investidor: meuIdRelacional as string },
            include: { startup: { include: { usuario: true } }, investidor: { include: { usuario: true } } }
        });

        const matches = await prisma.match_conexao.findMany({
            where: isStartup ? { id_startup: meuIdRelacional as string } : { id_investidor: meuIdRelacional as string },
            include: { startup: { include: { usuario: true } }, investidor: { include: { usuario: true } } }
        });

        // Formata os dados da "outra" pessoa para o front-end
        const formatarOutro = (rel: any) => {
            const outro = isStartup ? rel.investidor.usuario : rel.startup.usuario;
            return {
                id: outro.id_usuario,
                nome: outro.nome,
                foto: outro.foto_url,
                status: rel.status
            };
        };

        const resultado = {
            enviados: { ativos: [] as any[], historico: [] as any[] },
            recebidos: { ativos: [] as any[], historico: [] as any[] },
            matches: { ativos: [] as any[], historico: [] as any[] }
        };

        interesses.forEach(i => {
            const souRemetente = i.iniciado_por === usuario.tipo_usuario;
            const formatado = formatarOutro(i);
            
            if (souRemetente) {
                if (i.status === 'pendente') resultado.enviados.ativos.push(formatado);
                else resultado.enviados.historico.push(formatado);
            } else {
                if (i.status === 'pendente') resultado.recebidos.ativos.push(formatado);
                else resultado.recebidos.historico.push(formatado);
            }
        });

        matches.forEach(m => {
            const formatado = formatarOutro(m);
            if (m.status === 'ativo') resultado.matches.ativos.push(formatado);
            else resultado.matches.historico.push(formatado);
        });

        res.json(resultado);
    } catch (error) {
        console.error("Erro detalhes dashboard:", error);
        res.status(500).json({ error: 'Erro interno ao buscar detalhes' });
    }
};