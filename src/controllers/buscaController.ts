import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';

const prisma = new PrismaClient();

export const buscarPerfis = async (req: AuthRequest, res: Response) => {
    try {
        const usuarioId = req.usuarioId;
        if (!usuarioId) return res.status(401).json({ error: 'Não autorizado' });

        const usuarioLogado = await prisma.usuario.findUnique({
            where: { id_usuario: usuarioId }
        });

        if (!usuarioLogado) return res.status(404).json({ error: 'Usuário não encontrado' });

        const { texto, localizacao, estagio } = req.body;

        // CORREÇÃO AQUI: Tipagem explícita para any[]
        let resultados: any[] = [];

        if (usuarioLogado.tipo_usuario === 'investidor') {
            const startups = await prisma.startup.findMany({
                where: {
                    ...(localizacao ? { cidade: localizacao } : {}),
                    ...(estagio ? { estagio: estagio as any } : {}),
                    ...(texto ? {
                        OR: [
                            { nome_fantasia: { contains: texto } },
                            { descricao: { contains: texto } }
                        ]
                    } : {})
                },
                include: { usuario: true } 
            });

            resultados = startups.map(s => ({
                id: s.id_usuario,
                nome: s.usuario.nome,
                email: s.usuario.email,
                papel: 'startup',
                foto: s.usuario.foto_url,
                localizacao: s.cidade,
                descricao: s.descricao,
                segmento: 'Outro', 
                estagio: s.estagio,
                valorInvestimento: Number(s.investimento_pretendido),
                participacaoOferecida: Number(s.participacao_oferecida)
            }));
        } 
        else if (usuarioLogado.tipo_usuario === 'startup') {
            const investidores = await prisma.investidor.findMany({
                where: {
                    ...(localizacao ? { cidade: localizacao } : {}),
                    ...(texto ? { tese_investimento: { contains: texto } } : {})
                },
                include: { usuario: true }
            });

            resultados = investidores.map(i => ({
                id: i.id_usuario,
                nome: i.usuario.nome,
                email: i.usuario.email,
                papel: 'investidor',
                foto: i.usuario.foto_url,
                localizacao: i.cidade,
                tese: i.tese_investimento,
                investimentoMinimo: Number(i.faixa_minima),
                investimentoMaximo: Number(i.faixa_maxima),
                segmentosInteresse: ['Outro'], 
                estagiosPreferidos: [] 
            }));
        }

        res.json(resultados);
    } catch (error) {
        console.error("Erro na busca:", error);
        res.status(500).json({ error: 'Erro ao buscar perfis' });
    }
};