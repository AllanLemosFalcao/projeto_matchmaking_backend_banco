import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto'; // Gerador nativo de IDs do Node.js

const mapearEstagioInvestidor = (estagioFront: string) => {
    const mapa: Record<string, string> = {
        'Ideação': 'ideacao',
        'Validação': 'validacao',
        'MVP': 'MVP',
        'Tração inicial': 'tracao_inicial', // Correção conforme schema
        'Crescimento / Scale': 'crescimento___scale' // Correção conforme schema
    };
    return mapa[estagioFront] || 'ideacao';
};

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

const prisma = new PrismaClient();

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

// ==========================================
// 1. FUNÇÃO DE CADASTRO (REGISTER)
// ==========================================
export const register = async (req: Request, res: Response) => {
    try {
        const {
    papel, nome, email, senha, localizacao, foto, aceiteTermos,
    descricao, segmento, estagio, composicaoEquipe, mercado, modeloNegocio, valorInvestimento, participacaoOferecida,
    tese, segmentosInteresse, estagiosPreferidos, investimentoMinimo, investimentoMaximo
} = req.body;

        const existingUser = await prisma.usuario.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'E-mail já cadastrado.' });
        }

        const senha_hash = await bcrypt.hash(senha, 10);
        
        // Gera o ID do usuário antecipadamente para usar nas tabelas dependentes
        const userId = randomUUID();

        const novoUsuario = await prisma.$transaction(async (tx) => {
            
            const usuario = await tx.usuario.create({
                data: {
                    id_usuario: userId,    
                    nome,
                    email,
                    senha_hash,
                    tipo_usuario: papel as any, // Ignora a tipagem estrita do Prisma para o Enum
                    foto_url: foto || null, 
                }
            });
        // Registro do Consentimento LGPD
            if (aceiteTermos) {
                await tx.consentimento_lgpd.create({
                    data: {
                        id_consentimento: randomUUID(),
                        id_usuario: userId,
                        tipo_consentimento: 'termos_e_privacidade',
                        versao_termo: 'v1.0',
                        aceite: true
                    }
                });
            }
            if (papel === 'startup') {
                const id_startup = randomUUID();
                await tx.startup.create({
                    data: {
                        id_startup: id_startup,
                        id_usuario: userId,
                        nome_fantasia: nome, 
                        cidade: localizacao,
                        descricao: descricao,
                        estagio: mapearEstagio(estagio) as any, 
                        investimento_pretendido: valorInvestimento,
                        composicao_equipe: composicaoEquipe,
                        mercado: mercado,
                        modelo_negocio: modeloNegocio,
                        participacao_oferecida: participacaoOferecida
                    }
                });

                if (segmento) {
                    let seg = await tx.segmento.findFirst({ where: { nome: segmento } });
                    if (!seg) seg = await tx.segmento.create({ data: { id_segmento: randomUUID(), nome: segmento } });
                    await tx.startup_segmento.create({
                        data: { id_startup: id_startup, id_segmento: seg.id_segmento, principal: true }
                    });
                }

            } else if (papel === 'investidor') {
                const id_investidor = randomUUID();
                await tx.investidor.create({
                    data: {
                        id_investidor: id_investidor,
                        id_usuario: userId,
                        cidade: localizacao,
                        tese_investimento: tese,
                        faixa_minima: investimentoMinimo,
                        faixa_maxima: investimentoMaximo,
                        tipo_investidor: 'outro' 
                    }
                });

                for (const nomeSeg of (segmentosInteresse || [])) {
                    let seg = await tx.segmento.findFirst({ where: { nome: nomeSeg } });
                    if (!seg) seg = await tx.segmento.create({ data: { id_segmento: randomUUID(), nome: nomeSeg } });
                    await tx.investidor_segmento.create({
                        data: { id_investidor: id_investidor, id_segmento: seg.id_segmento }
                    });
                }

                for (const est of (estagiosPreferidos || [])) {
                    await tx.investidor_estagio.create({
                        data: { id_investidor: id_investidor, estagio: mapearEstagioInvestidor(est) as any }
                    });
                }
            }

            return usuario;
        });

        const token = jwt.sign(
            { id: novoUsuario.id_usuario, tipo: novoUsuario.tipo_usuario },
            process.env.JWT_SECRET || 'secret_padrao',
            { expiresIn: '1d' }
        );

        let perfilRetorno: any = {
            id: novoUsuario.id_usuario,
            nome: novoUsuario.nome,
            email: novoUsuario.email,
            papel: novoUsuario.tipo_usuario,
            foto: novoUsuario.foto_url,
            token
        };

        if (papel === 'startup') {
            Object.assign(perfilRetorno, {
                localizacao,
                descricao,
                segmento,
                estagio,
                composicaoEquipe,
                mercado,
                modeloNegocio,
                valorInvestimento: Number(valorInvestimento),
                participacaoOferecida: Number(participacaoOferecida)
            });
        } else if (papel === 'investidor') {
            Object.assign(perfilRetorno, {
                localizacao,
                tese,
                segmentosInteresse: segmentosInteresse || [],
                estagiosPreferidos: estagiosPreferidos || [],
                investimentoMinimo: Number(investimentoMinimo),
                investimentoMaximo: Number(investimentoMaximo)
            });
        }

        res.status(201).json(perfilRetorno);

    } catch (error) {
        console.error("Erro no cadastro:", error);
        res.status(500).json({ error: 'Erro interno ao processar o cadastro.' });
    }
};

// ==========================================
// 2. FUNÇÃO DE LOGIN (LOGIN)
// ==========================================
export const login = async (req: Request, res: Response) => {
    try {
        const { email, senha } = req.body;

        const usuario = await prisma.usuario.findUnique({ 
            where: { email },
            include: {
                startup: true, 
                investidor: true 
            }
        });
        
        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        const validPassword = await bcrypt.compare(senha, usuario.senha_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Senha incorreta.' });
        }

        const token = jwt.sign(
            { id: usuario.id_usuario, tipo: usuario.tipo_usuario },
            process.env.JWT_SECRET || 'secret_padrao',
            { expiresIn: '1d' }
        );

        let perfilBase = {
            id: usuario.id_usuario,
            nome: usuario.nome,
            email: usuario.email,
            papel: usuario.tipo_usuario,
            token, 
        };

        if (usuario.tipo_usuario === 'startup' && usuario.startup) {
            Object.assign(perfilBase, {
                localizacao: usuario.startup.cidade,
                descricao: usuario.startup.descricao,
                estagio: usuario.startup.estagio,
                valorInvestimento: Number(usuario.startup.investimento_pretendido),
                composicaoEquipe: usuario.startup.composicao_equipe,
                mercado: usuario.startup.mercado,
                modeloNegocio: usuario.startup.modelo_negocio,
                participacaoOferecida: Number(usuario.startup.participacao_oferecida)
            });
        } else if (usuario.tipo_usuario === 'investidor' && usuario.investidor) {
            
            const relSegmentos = await prisma.investidor_segmento.findMany({ 
                where: { id_investidor: usuario.investidor.id_investidor },
                include: { segmento: true }
            });
            const arraySegmentos = relSegmentos.map(rel => rel.segmento.nome);

            const relEstagios = await prisma.investidor_estagio.findMany({ 
                where: { id_investidor: usuario.investidor.id_investidor }
            });
            const arrayEstagios = relEstagios.map(r => desmapearEstagioInvestidor(r.estagio));

            Object.assign(perfilBase, {
                localizacao: usuario.investidor.cidade,
                tese: usuario.investidor.tese_investimento,
                investimentoMinimo: Number(usuario.investidor.faixa_minima),
                investimentoMaximo: Number(usuario.investidor.faixa_maxima),
                segmentosInteresse: arraySegmentos,
                estagiosPreferidos: arrayEstagios
            });
        }

        res.json(perfilBase);
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
};