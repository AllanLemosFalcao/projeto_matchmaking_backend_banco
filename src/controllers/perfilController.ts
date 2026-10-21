import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';
import { randomUUID } from 'crypto';

const mapearEstagioInvestidor = (estagioFront: string) => {
    const mapa: Record<string, string> = {
        'Ideação': 'ideacao',
        'Validação': 'validacao',
        'MVP': 'MVP',
        'Tração inicial': 'tracao_inicial', 
        'Crescimento / Scale': 'crescimento___scale' 
    };
    return mapa[estagioFront] || 'ideacao';
};

const prisma = new PrismaClient();

// Mantém o mesmo mapeamento do front para o banco
const mapearEstagio = (estagioFront: string) => {
    const mapa: Record<string, string> = {
        'Ideação': 'ideacao',
        'Validação': 'validacao',
        'MVP': 'validacao',
        'Tração inicial': 'tracao',
        'Crescimento / Scale': 'escala'
    };
    return mapa[estagioFront] || 'ideacao';
};

export const atualizarPerfil = async (req: AuthRequest, res: Response) => {
    try {
        const usuarioId = req.usuarioId;
        if (!usuarioId) return res.status(401).json({ error: 'Não autorizado' });

        const dados = req.body;

        // 1. Atualiza dados comuns na tabela base
        const usuarioAtualizado = await prisma.usuario.update({
            where: { id_usuario: usuarioId },
            data: {
                nome: dados.nome,
                foto_url: dados.foto || null
            }
        });

        // 2. Atualiza dados específicos baseado no papel
        // 2. Atualiza dados específicos baseado no papel
        if (usuarioAtualizado.tipo_usuario === 'startup') {
            // Atualiza os dados básicos da startup e guarda o resultado na variável 'st'
            const st = await prisma.startup.update({
                where: { id_usuario: usuarioId },
                data: {
                    cidade: dados.localizacao,
                    descricao: dados.descricao,
                    estagio: mapearEstagio(dados.estagio) as any,
                    composicao_equipe: dados.composicaoEquipe,
                    mercado: dados.mercado,
                    modelo_negocio: dados.modeloNegocio,
                    investimento_pretendido: dados.valorInvestimento,
                    participacao_oferecida: dados.participacaoOferecida
                }
            });

            // === NOVA LÓGICA: Atualiza o segmento da Startup ===
            if (dados.segmento) {
                // 1. Remove as ligações de segmentos antigos desta startup
                await prisma.startup_segmento.deleteMany({ 
                    where: { id_startup: st.id_startup } 
                });

                // 2. Procura se o novo segmento escolhido já existe no banco, se não, cria
                let seg = await prisma.segmento.findFirst({ where: { nome: dados.segmento } });
                if (!seg) {
                    seg = await prisma.segmento.create({ 
                        data: { id_segmento: randomUUID(), nome: dados.segmento } 
                    });
                }

                // 3. Cria a nova ligação entre a startup e o novo segmento
                await prisma.startup_segmento.create({
                    data: { id_startup: st.id_startup, id_segmento: seg.id_segmento, principal: true }
                });
            }
            
        } else if (usuarioAtualizado.tipo_usuario === 'investidor') {
            await prisma.investidor.update({
                where: { id_usuario: usuarioId },
                data: {
                    cidade: dados.localizacao,
                    tese_investimento: dados.tese,
                    faixa_minima: dados.investimentoMinimo,
                    faixa_maxima: dados.investimentoMaximo
                }
            });

            const inv = await prisma.investidor.findUnique({ where: { id_usuario: usuarioId } });
            
            if (inv) {
                // Remove as ligações antigas
                await prisma.investidor_segmento.deleteMany({ where: { id_investidor: inv.id_investidor } });
                await prisma.investidor_estagio.deleteMany({ where: { id_investidor: inv.id_investidor } });

                // Insere as novas seleções
                for (const nomeSeg of (dados.segmentosInteresse || [])) {
                    let seg = await prisma.segmento.findFirst({ where: { nome: nomeSeg } });
                    if (!seg) seg = await prisma.segmento.create({ data: { id_segmento: randomUUID(), nome: nomeSeg } });
                    await prisma.investidor_segmento.create({
                        data: { id_investidor: inv.id_investidor, id_segmento: seg.id_segmento }
                    });
                }

                for (const est of (dados.estagiosPreferidos || [])) {
                    await prisma.investidor_estagio.create({
                        data: { id_investidor: inv.id_investidor, estagio: mapearEstagioInvestidor(est) as any }
                    });
                }
            }
        }

        return res.json({ message: 'Perfil atualizado com sucesso', perfil: dados });

    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        res.status(500).json({ error: 'Erro interno ao atualizar perfil' });
    }
};