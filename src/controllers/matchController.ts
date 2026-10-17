import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware'; 
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// ==========================================
// CRIAR INTERESSE
// ==========================================
export const criarInteresse = async (req: AuthRequest, res: Response) => {
    try {
        let { id_startup, id_investidor, iniciado_por, mensagem } = req.body;

        if (!req.usuarioId) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const startupPorUsuario = await prisma.startup.findUnique({
            where: { id_usuario: id_startup }
        });
        if (startupPorUsuario) {
            id_startup = startupPorUsuario.id_startup;
        }

        const investidorPorUsuario = await prisma.investidor.findUnique({
            where: { id_usuario: id_investidor }
        });
        if (investidorPorUsuario) {
            id_investidor = investidorPorUsuario.id_investidor;
        }

        const novoInteresse = await prisma.interesse.create({
            data: {
                id_interesse: randomUUID(),
                id_startup,
                id_investidor,
                iniciado_por: iniciado_por as any,
                mensagem: mensagem || 'Interesse demonstrado na plataforma.'
            }
        });

        res.status(201).json({ message: 'Interesse enviado!', interesse: novoInteresse });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Interesse já registrado anteriormente.' });
        }
        console.error("Erro ao criar interesse:", error);
        res.status(500).json({ error: 'Erro interno ao processar interesse.' });
    }
};

// ==========================================
// LISTAR INTERESSES RECEBIDOS (PENDENTES)
// ==========================================
export const interessesPendentes = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.usuarioId) return res.status(401).json({ error: 'Não autorizado' });

        const usuarioLogado = await prisma.usuario.findUnique({
            where: { id_usuario: req.usuarioId },
            include: { startup: true, investidor: true }
        });

        if (!usuarioLogado) return res.status(404).json({ error: 'Usuário não encontrado' });

        let pendentesRaw = [];

        if (usuarioLogado.tipo_usuario === 'startup' && usuarioLogado.startup) {
            pendentesRaw = await prisma.interesse.findMany({
                where: { 
                    id_startup: usuarioLogado.startup.id_startup, 
                    iniciado_por: 'investidor' 
                },
                include: { 
                    investidor: { include: { usuario: true } } 
                }
            });
            
            const perfis = pendentesRaw.map(p => ({
                id: p.investidor.id_usuario, 
                nome: p.investidor.usuario.nome,
                email: p.investidor.usuario.email,
                papel: 'investidor',
                foto: p.investidor.usuario.foto_url,
                localizacao: p.investidor.cidade,
                tese: p.investidor.tese_investimento,
                investimentoMinimo: Number(p.investidor.faixa_minima),
                investimentoMaximo: Number(p.investidor.faixa_maxima),
            }));
            return res.json(perfis);
        } 
        
        else if (usuarioLogado.tipo_usuario === 'investidor' && usuarioLogado.investidor) {
            pendentesRaw = await prisma.interesse.findMany({
                where: { 
                    id_investidor: usuarioLogado.investidor.id_investidor, 
                    iniciado_por: 'startup' 
                },
                include: { 
                    startup: { include: { usuario: true } } 
                }
            });

            const perfis = pendentesRaw.map(p => ({
                id: p.startup.id_usuario,
                nome: p.startup.usuario.nome,
                email: p.startup.usuario.email,
                papel: 'startup',
                foto: p.startup.usuario.foto_url,
                localizacao: p.startup.cidade,
                descricao: p.startup.descricao,
                estagio: p.startup.estagio,
                valorInvestimento: Number(p.startup.investimento_pretendido),
                participacaoOferecida: Number(p.startup.participacao_oferecida)
            }));
            return res.json(perfis);
        }

        res.json([]);
    } catch (error) {
        console.error("Erro ao listar pendentes:", error);
        res.status(500).json({ error: 'Erro interno ao listar pendentes' });
    }
};

// ==========================================
// ACEITAR O MATCH
// ==========================================
export const aceitarMatch = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.usuarioId) return res.status(401).json({ error: 'Não autorizado' });
        
        const { alvoId } = req.body; 

        const usuarioLogado = await prisma.usuario.findUnique({
            where: { id_usuario: req.usuarioId },
            include: { startup: true, investidor: true }
        });

        const usuarioAlvo = await prisma.usuario.findUnique({
            where: { id_usuario: alvoId },
            include: { startup: true, investidor: true }
        });

        if (!usuarioLogado || !usuarioAlvo) return res.status(404).json({ error: 'Usuário inválido' });

        const id_startup = usuarioLogado.tipo_usuario === 'startup' ? usuarioLogado.startup?.id_startup : usuarioAlvo.startup?.id_startup;
        const id_investidor = usuarioLogado.tipo_usuario === 'investidor' ? usuarioLogado.investidor?.id_investidor : usuarioAlvo.investidor?.id_investidor;

        if(!id_startup || !id_investidor) return res.status(400).json({error: "Erro de mapeamento de IDs"});

        // Usa prisma.matches.create corretamente (com a tabela que você acabou de criar no MySQL)
        const novoMatch = await prisma.matches.create({
            data: {
                id_match: randomUUID(),
                id_startup: id_startup,
                id_investidor: id_investidor
            }
        });

        res.status(201).json({ message: 'Match realizado com sucesso!', match: novoMatch });
    } catch (error) {
        console.error("Erro ao aceitar match:", error);
        res.status(500).json({ error: 'Erro interno ao processar match' });
    }
};