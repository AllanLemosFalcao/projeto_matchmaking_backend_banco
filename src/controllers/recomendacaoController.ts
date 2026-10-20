import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';

const prisma = new PrismaClient();

const desmapearEstagioInvestidor = (estagioBanco: string) => {
    const mapa: Record<string, string> = {
        'ideacao': 'Ideação',
        'validacao': 'Validação',
        'MVP': 'MVP',
        'tracao_inicial': 'Tração inicial',
        'crescimento___scale': 'Crescimento / Scale'
    };
    return mapa[estagioBanco] || 'Ideação';
};

export const obterRecomendacoes = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.usuarioId) return res.status(401).json({ error: 'Não autorizado' });

        const usuarioLogado = await prisma.usuario.findUnique({
            where: { id_usuario: req.usuarioId },
            include: {
                startup: { include: { startup_segmento: { include: { segmento: true } } } },
                investidor: { include: { investidor_segmento: { include: { segmento: true } } } }
            }
        });

        if (!usuarioLogado) return res.status(404).json({ error: 'Usuário não encontrado' });

        let recomendacoes: any[] = [];

        // -----------------------------------------------------
        // SE FOR INVESTIDOR: Recomenda Startups compatíveis
        // -----------------------------------------------------
        if (usuarioLogado.tipo_usuario === 'investidor' && usuarioLogado.investidor) {
            const inv = usuarioLogado.investidor;
            const segmentosInteresse = inv.investidor_segmento.map(s => s.segmento.nome);

            const startups = await prisma.startup.findMany({
                include: { usuario: true, startup_segmento: { include: { segmento: true } } }
            });

            const pontuadas = startups.map(s => {
                let score = 0;
                const segPrincipal = s.startup_segmento.find(ss => ss.principal) || s.startup_segmento[0];
                const segmentoNome = segPrincipal ? segPrincipal.segmento.nome : 'Outro';

                // Algoritmo simples de Match
                if (segmentosInteresse.includes(segmentoNome)) score += 50; // Mesmo segmento ganha 50 pts
                if (s.cidade?.toLowerCase() === inv.cidade?.toLowerCase()) score += 30; // Mesma cidade ganha 30 pts

                return {
                    id: s.id_usuario,
                    nome: s.usuario.nome,
                    email: s.usuario.email,
                    papel: 'startup',
                    foto: s.usuario.foto_url,
                    localizacao: s.cidade,
                    descricao: s.descricao,
                    segmento: segmentoNome,
                    estagio: s.estagio,
                    valorInvestimento: Number(s.investimento_pretendido),
                    participacaoOferecida: Number(s.participacao_oferecida),
                    score // Armazena a pontuação para ordenação
                };
            });

            // Ordena da maior nota para a menor e pega os 4 melhores
            recomendacoes = pontuadas.sort((a, b) => b.score - a.score).slice(0, 4);
        } 
        
        // -----------------------------------------------------
        // SE FOR STARTUP: Recomenda Investidores compatíveis
        // -----------------------------------------------------
        else if (usuarioLogado.tipo_usuario === 'startup' && usuarioLogado.startup) {
            const st = usuarioLogado.startup;
            const segPrincipal = st.startup_segmento.find(ss => ss.principal) || st.startup_segmento[0];
            const meuSegmento = segPrincipal ? segPrincipal.segmento.nome : '';

            const investidores = await prisma.investidor.findMany({
                include: { usuario: true, investidor_segmento: { include: { segmento: true } }, investidor_estagio: true }
            });

            const pontuados = investidores.map(i => {
                let score = 0;
                const segmentosInteresse = i.investidor_segmento.map(s => s.segmento.nome);

                // Algoritmo simples de Match
                if (segmentosInteresse.includes(meuSegmento)) score += 50; 
                if (i.cidade?.toLowerCase() === st.cidade?.toLowerCase()) score += 30;

                return {
                    id: i.id_usuario,
                    nome: i.usuario.nome,
                    email: i.usuario.email,
                    papel: 'investidor',
                    foto: i.usuario.foto_url,
                    localizacao: i.cidade,
                    tese: i.tese_investimento,
                    investimentoMinimo: Number(i.faixa_minima),
                    investimentoMaximo: Number(i.faixa_maxima),
                    segmentosInteresse: segmentosInteresse,
                    estagiosPreferidos: i.investidor_estagio.map(e => desmapearEstagioInvestidor(e.estagio)),
                    score
                };
            });

            recomendacoes = pontuados.sort((a, b) => b.score - a.score).slice(0, 4);
        }

        res.json(recomendacoes);
    } catch (error) {
        console.error("Erro nas recomendações:", error);
        res.status(500).json({ error: 'Erro ao buscar recomendações' });
    }
};