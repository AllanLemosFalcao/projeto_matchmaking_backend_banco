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
                    iniciado_por: 'investidor',
                    status: 'pendente' 
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
                segmentosInteresse: ['Outro'], 
                estagiosPreferidos: []
            }));
            return res.json(perfis);
        } 
        
        else if (usuarioLogado.tipo_usuario === 'investidor' && usuarioLogado.investidor) {
            pendentesRaw = await prisma.interesse.findMany({
                where: { 
                    id_investidor: usuarioLogado.investidor.id_investidor, 
                    iniciado_por: 'startup',
                    status: 'pendente'
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

        // 1. ATUALIZA O STATUS DO INTERESSE PARA 'ACEITO' (Isso remove a notificação do sino)
        await prisma.interesse.updateMany({
            where: {
                id_startup: id_startup,
                id_investidor: id_investidor,
                status: 'pendente'
            },
            data: { status: 'aceito' }
        });

        // 2. VERIFICA SE O MATCH JÁ EXISTE (Para não duplicar a conversa)
        let matchExistente = await prisma.match_conexao.findFirst({
            where: { id_startup: id_startup, id_investidor: id_investidor }
        });

        let matchFinal;

        if (matchExistente) {
            matchFinal = matchExistente;

            // Self-healing: Garante que a conversa existe mesmo se reaproveitar o match
            const conversaExistente = await prisma.conversa.findFirst({
                where: { id_match: matchExistente.id_match }
            });

            if (!conversaExistente) {
                await prisma.conversa.create({
                    data: {
                        id_conversa: randomUUID(),
                        match_conexao: { connect: { id_match: matchExistente.id_match } }
                    }
                });
            }
        } else {
            // 3. SE NÃO EXISTIR, CRIA O MATCH E A CONVERSA DO ZERO
            const novoMatchId = randomUUID();
            matchFinal = await prisma.match_conexao.create({
                data: {
                    id_match: novoMatchId,
                    id_startup: id_startup,
                    id_investidor: id_investidor
                }
            });

            await prisma.conversa.create({
                data: {
                    id_conversa: randomUUID(),
                    match_conexao: { connect: { id_match: novoMatchId } }
                }
            });
        }

        res.status(201).json({ message: 'Match realizado com sucesso!', match: matchFinal });
    } catch (error) {
        console.error("Erro ao aceitar match:", error);
        res.status(500).json({ error: 'Erro interno ao processar match' });
    }
};

// ==========================================
// LISTAR MATCHES CONFIRMADOS
// ==========================================
export const listarMatches = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.usuarioId) return res.status(401).json({ error: 'Não autorizado' });

        const usuarioLogado = await prisma.usuario.findUnique({
            where: { id_usuario: req.usuarioId },
            include: { startup: true, investidor: true }
        });

        if (!usuarioLogado) return res.status(404).json({ error: 'Usuário não encontrado' });

        let matchesRaw = [];

        if (usuarioLogado.tipo_usuario === 'startup' && usuarioLogado.startup) {
            matchesRaw = await prisma.match_conexao.findMany({ // <- Mude de matches para match_conexao
    where: { id_startup: usuarioLogado.startup.id_startup },
    include: { investidor: { include: { usuario: true } } }
});

            const formatado = matchesRaw.map(m => ({
                match: { 
                    id: m.id_match, 
                    usuarios: [usuarioLogado.id_usuario, m.investidor.id_usuario], 
                    criadoEm: (m.data_match || new Date()).toISOString() 
                },
                outro: {
                    id: m.investidor.id_usuario,
                    nome: m.investidor.usuario.nome,
                    email: m.investidor.usuario.email,
                    papel: 'investidor',
                    foto: m.investidor.usuario.foto_url,
                    localizacao: m.investidor.cidade,
                    tese: m.investidor.tese_investimento,
                    investimentoMinimo: Number(m.investidor.faixa_minima),
                    investimentoMaximo: Number(m.investidor.faixa_maxima),
                    segmentosInteresse: ['Outro'], 
                    estagiosPreferidos: []         
                } // <-- A chave que faltava fechar!
            }));
            return res.json(formatado);
        } 
        else if (usuarioLogado.tipo_usuario === 'investidor' && usuarioLogado.investidor) {
            matchesRaw = await prisma.match_conexao.findMany({ // <- Mude de matches para match_conexao
    where: { id_investidor: usuarioLogado.investidor.id_investidor },
    include: { startup: { include: { usuario: true } } }
});

            const formatado = matchesRaw.map(m => ({
                match: { 
                    id: m.id_match, 
                    usuarios: [usuarioLogado.id_usuario, m.startup.id_usuario], 
                    criadoEm: (m.data_match || new Date()).toISOString() 
                },
                outro: {
                    id: m.startup.id_usuario,
                    nome: m.startup.usuario.nome,
                    email: m.startup.usuario.email,
                    papel: 'startup',
                    foto: m.startup.usuario.foto_url,
                    localizacao: m.startup.cidade,
                    descricao: m.startup.descricao,
                    estagio: m.startup.estagio,
                    valorInvestimento: Number(m.startup.investimento_pretendido),
                    participacaoOferecida: Number(m.startup.participacao_oferecida),
                    segmentosInteresse: [], 
                    estagiosPreferidos: []
                }
            }));
            return res.json(formatado);
        }

        res.json([]);
    } catch (error) {
        console.error("Erro ao listar matches:", error);
        res.status(500).json({ error: 'Erro interno ao listar matches' });
    }
};

// ==========================================
// LISTAR INTERESSES ENVIADOS (Para saber em quem o usuário já clicou)
// ==========================================
export const interessesEnviados = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.usuarioId) return res.status(401).json({ error: 'Não autorizado' });
        
        const usuarioLogado = await prisma.usuario.findUnique({
            where: { id_usuario: req.usuarioId },
            include: { startup: true, investidor: true }
        });

        if (usuarioLogado?.tipo_usuario === 'startup' && usuarioLogado.startup) {
            const interesses = await prisma.interesse.findMany({
                where: { id_startup: usuarioLogado.startup.id_startup, iniciado_por: 'startup' },
                include: { investidor: true }
            });
            // Retorna um array com os IDs dos usuários (investidores)
            return res.json(interesses.map(i => i.investidor.id_usuario));
        } 
        else if (usuarioLogado?.tipo_usuario === 'investidor' && usuarioLogado.investidor) {
            const interesses = await prisma.interesse.findMany({
                where: { id_investidor: usuarioLogado.investidor.id_investidor, iniciado_por: 'investidor' },
                include: { startup: true }
            });
            // Retorna um array com os IDs dos usuários (startups)
            return res.json(interesses.map(i => i.startup.id_usuario));
        }

        res.json([]);
    } catch (error) {
        console.error("Erro ao buscar interesses enviados:", error);
        res.status(500).json({ error: 'Erro interno' });
    }
};

// ==========================================
// RECUSAR O INTERESSE
// ==========================================
export const recusarInteresse = async (req: AuthRequest, res: Response) => {
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

        // ATUALIZA O STATUS DO INTERESSE PARA 'RECUSADO'
        await prisma.interesse.updateMany({
            where: {
                id_startup: id_startup,
                id_investidor: id_investidor,
                status: 'pendente'
            },
            data: { status: 'recusado' }
        });

        res.status(200).json({ message: 'Interesse recusado.' });
    } catch (error) {
        console.error("Erro ao recusar interesse:", error);
        res.status(500).json({ error: 'Erro interno ao recusar interesse' });
    }
};