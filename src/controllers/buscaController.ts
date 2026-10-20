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

export const buscarPerfis = async (req: AuthRequest, res: Response) => {
    try {
        const usuarioId = req.usuarioId;
        if (!usuarioId) return res.status(401).json({ error: 'Não autorizado' });

        // Modificamos a busca do usuário logado para trazer os segmentos e cidade dele
        const usuarioLogado = await prisma.usuario.findUnique({
            where: { id_usuario: usuarioId },
            include: {
                startup: { include: { startup_segmento: { include: { segmento: true } } } },
                investidor: { include: { investidor_segmento: { include: { segmento: true } } } }
            }
        });

        if (!usuarioLogado) return res.status(404).json({ error: 'Usuário não encontrado' });

        const { texto, localizacao, estagio } = req.body;
        let resultados: any[] = [];

        if (usuarioLogado.tipo_usuario === 'investidor') {
            
            // Dados do investidor logado para cruzar
            const inv = usuarioLogado.investidor;
            const meusSegmentos = inv?.investidor_segmento.map((s:any) => s.segmento.nome) || [];
            const minhaCidade = inv?.cidade?.toLowerCase() || '';

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
                include: { 
                    usuario: true,
                    startup_segmento: { include: { segmento: true } }
                } 
            });

            resultados = startups.map(s => {
                const segPrincipal = s.startup_segmento.find((ss:any) => ss.principal) || s.startup_segmento[0];
                const nomeSegmento = segPrincipal ? segPrincipal.segmento.nome : 'Outro';
                
                // CÁLCULO DE SCORE
                let score = 0;
                if (meusSegmentos.includes(nomeSegmento)) score += 50;
                if (s.cidade?.toLowerCase() === minhaCidade) score += 30;

                return {
                    id: s.id_usuario,
                    nome: s.usuario.nome,
                    email: s.usuario.email,
                    papel: 'startup',
                    foto: s.usuario.foto_url,
                    localizacao: s.cidade,
                    descricao: s.descricao,
                    segmento: nomeSegmento, 
                    estagio: s.estagio,
                    valorInvestimento: Number(s.investimento_pretendido),
                    participacaoOferecida: Number(s.participacao_oferecida),
                    score // Enviando pro front!
                };
            });
            // Ordena os resultados da busca pelo melhor match primeiro
            resultados.sort((a, b) => b.score - a.score);

        } 
        else if (usuarioLogado.tipo_usuario === 'startup') {
            
            // Dados da startup logada para cruzar
            const st = usuarioLogado.startup;
            const segPrincipal = st?.startup_segmento.find((ss:any) => ss.principal) || st?.startup_segmento[0];
            const meuSegmento = segPrincipal ? segPrincipal.segmento.nome : '';
            const minhaCidade = st?.cidade?.toLowerCase() || '';

            const investidores = await prisma.investidor.findMany({
                where: {
                    ...(localizacao ? { cidade: localizacao } : {}),
                    ...(texto ? { tese_investimento: { contains: texto } } : {})
                },
                include: { 
                    usuario: true,
                    investidor_segmento: { include: { segmento: true } },
                    investidor_estagio: true
                }
            });

            resultados = investidores.map(i => {
                const segmentosDoInvestidor = i.investidor_segmento.map((s:any) => s.segmento.nome);
                
                // CÁLCULO DE SCORE
                let score = 0;
                if (segmentosDoInvestidor.includes(meuSegmento)) score += 50;
                if (i.cidade?.toLowerCase() === minhaCidade) score += 30;

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
                    segmentosInteresse: segmentosDoInvestidor, 
                    estagiosPreferidos: i.investidor_estagio.map((e:any) => e.estagio),
                    score // Enviando pro front!
                };
            });
            // Ordena os resultados da busca pelo melhor match primeiro
            resultados.sort((a, b) => b.score - a.score);
        }

        res.json(resultados);
    } catch (error) {
        console.error("Erro na busca:", error);
        res.status(500).json({ error: 'Erro ao buscar perfis' });
    }
};

export const buscarPerfilPorId = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.usuarioId) return res.status(401).json({ error: 'Não autorizado' });

        // Correção 1: Força o TypeScript a entender que o ID é uma string única
        const id = req.params.id as string;

        // Correção 2: Adicionado 'as any' para o Prisma não bloquear o include na validação estrita
        const usuarioAlvo = await prisma.usuario.findUnique({
            where: { id_usuario: id },
            include: {
                startup: { include: { startup_segmento: { include: { segmento: true } } } },
                investidor: { include: { investidor_segmento: { include: { segmento: true } }, investidor_estagio: true } }
            }
        }) as any;

        if (!usuarioAlvo) return res.status(404).json({ error: 'Usuário não encontrado' });

        let perfilFormatado: any = {
            id: usuarioAlvo.id_usuario,
            nome: usuarioAlvo.nome,
            email: usuarioAlvo.email,
            papel: usuarioAlvo.tipo_usuario,
            foto: usuarioAlvo.foto_url
        };

        if (usuarioAlvo.tipo_usuario === 'startup' && usuarioAlvo.startup) {
            const s = usuarioAlvo.startup;
            
            // Correção 3: Tipagem explícita (ss: any) nos métodos de array
            const segPrincipal = s.startup_segmento.find((ss: any) => ss.principal) || s.startup_segmento[0];
            
            Object.assign(perfilFormatado, {
                localizacao: s.cidade,
                descricao: s.descricao,
                segmento: segPrincipal ? segPrincipal.segmento.nome : 'Outro',
                estagio: s.estagio,
                composicaoEquipe: s.composicao_equipe,
                mercado: s.mercado,
                modeloNegocio: s.modelo_negocio,
                valorInvestimento: Number(s.investimento_pretendido),
                participacaoOferecida: Number(s.participacao_oferecida)
            });
        } else if (usuarioAlvo.tipo_usuario === 'investidor' && usuarioAlvo.investidor) {
            const i = usuarioAlvo.investidor;
            
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

            Object.assign(perfilFormatado, {
                localizacao: i.cidade,
                tese: i.tese_investimento,
                investimentoMinimo: Number(i.faixa_minima),
                investimentoMaximo: Number(i.faixa_maxima),
                // Correção 4: Tipagem explícita (s: any) e (e: any) nos maps
                segmentosInteresse: i.investidor_segmento.map((s: any) => s.segmento.nome),
                estagiosPreferidos: i.investidor_estagio.map((e: any) => desmapearEstagioInvestidor(e.estagio))
            });
        }

        res.json(perfilFormatado);
    } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        res.status(500).json({ error: 'Erro ao buscar perfil detalhado' });
    }
};