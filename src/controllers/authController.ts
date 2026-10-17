import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto'; // Gerador nativo de IDs do Node.js

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
            papel, nome, email, senha, localizacao, foto,
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
                    id_usuario: userId, // ID gerado manualmente
                    nome,
                    email,
                    senha_hash,
                    tipo_usuario: papel as any, // Ignora a tipagem estrita do Prisma para o Enum
                    foto_url: foto || null, 
                }
            });

            if (papel === 'startup') {
                await tx.startup.create({
                    data: {
                        id_startup: randomUUID(), // ID gerado manualmente
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

            } else if (papel === 'investidor') {
                await tx.investidor.create({
                    data: {
                        id_investidor: randomUUID(), // ID gerado manualmente
                        id_usuario: userId,
                        cidade: localizacao,
                        tese_investimento: tese,
                        faixa_minima: investimentoMinimo,
                        faixa_maxima: investimentoMaximo,
                        tipo_investidor: 'outro' 
                    }
                });
            }

            return usuario;
        });

        const token = jwt.sign(
            { id: novoUsuario.id_usuario, tipo: novoUsuario.tipo_usuario },
            process.env.JWT_SECRET || 'secret_padrao',
            { expiresIn: '1d' }
        );

        res.status(201).json({
            id: novoUsuario.id_usuario,
            nome: novoUsuario.nome,
            email: novoUsuario.email,
            papel: novoUsuario.tipo_usuario,
            token
        });

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
            Object.assign(perfilBase, {
                localizacao: usuario.investidor.cidade,
                tese: usuario.investidor.tese_investimento,
                investimentoMinimo: Number(usuario.investidor.faixa_minima),
                investimentoMaximo: Number(usuario.investidor.faixa_maxima),
            });
        }

        res.json(perfilBase);
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
};