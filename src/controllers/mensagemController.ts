import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// ==========================================
// ENVIAR MENSAGEM
// ==========================================
export const enviarMensagem = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.usuarioId) return res.status(401).json({ error: 'Não autorizado' });

        const { matchId, texto } = req.body;

        if (!matchId || !texto) {
            return res.status(400).json({ error: 'MatchID e texto são obrigatórios' });
        }

        // 1. Tenta achar a conversa associada ao Match
        let conversa = await prisma.conversa.findFirst({
            where: { id_match: matchId }
        });

        // ==========================================
        // 2. O PULO DO GATO: AUTO-CURA (Self-Healing)
        // Se a conversa ainda não existir no banco (seja por um teste antigo ou falha),
        // nós simplesmente a criamos na hora, garantindo que o sistema não quebre!
        // ==========================================
        if (!conversa) {
            conversa = await prisma.conversa.create({
                data: {
                    id_conversa: randomUUID(),
                    match_conexao: { 
                        connect: { id_match: matchId } 
                    }
                }
            });
        }

        // 3. Agora salvamos a mensagem com 100% de certeza que a Conversa existe
        const novaMensagem = await prisma.mensagem.create({
            data: {
                id_mensagem: randomUUID(),
                id_conversa: conversa.id_conversa, 
                id_remetente_usuario: req.usuarioId,
                conteudo: texto
            }
        });

        const mensagemFormatada = {
            id: novaMensagem.id_mensagem,
            matchId: matchId, 
            autorId: novaMensagem.id_remetente_usuario,
            texto: novaMensagem.conteudo,
            enviadaEm: (novaMensagem.enviada_em || new Date()).toISOString()
        };

        // Dispara a mensagem em tempo real para a sala (matchId)
        const io = (req as any).io;
        if (io) {
            io.to(matchId).emit('nova_mensagem', mensagemFormatada);
        }

        // Devolvemos formatado para o React (MANTENHA APENAS ESTE E APAGUE O SEGUNDO)
        return res.status(201).json(mensagemFormatada);

    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        res.status(500).json({ error: 'Erro interno ao enviar mensagem' });
    }
};

// ==========================================
// LISTAR MENSAGENS DA CONVERSA
// ==========================================
export const listarMensagens = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.usuarioId) return res.status(401).json({ error: 'Não autorizado' });

        const matchId = req.params.matchId as string;

        // 1. O PULO DO GATO: Encontra a conversa real associada a este Match
        const conversa = await prisma.conversa.findFirst({
            where: { id_match: matchId }
        });

        if (!conversa) {
            // Se a conversa não existir no banco, retornamos vazio para não quebrar a tela
            return res.json([]);
        }

        // 2. Puxa as mensagens usando o ID correto da conversa
        const mensagens = await prisma.mensagem.findMany({
            where: { id_conversa: conversa.id_conversa },
            orderBy: { enviada_em: 'asc' } // Ordem cronológica
        });

        // Converte do formato do Banco para o formato do Front-end
        const formatadas = mensagens.map(m => ({
            id: m.id_mensagem,
            matchId: matchId,
            autorId: m.id_remetente_usuario,
            texto: m.conteudo,
            enviadaEm: (m.enviada_em || new Date()).toISOString()
        }));

        res.json(formatadas);
    } catch (error) {
        console.error("Erro ao listar mensagens:", error);
        res.status(500).json({ error: 'Erro interno ao listar mensagens' });
    }
};