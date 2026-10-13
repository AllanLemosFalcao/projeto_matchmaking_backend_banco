import { Request, Response } from 'express';
import { PrismaClient, TipoUsuario } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
    try {
        const { nome, email, senha, tipo_usuario } = req.body;

        const existingUser = await prisma.usuario.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'E-mail já cadastrado.' });
        }

        const senha_hash = await bcrypt.hash(senha, 10);

        const usuario = await prisma.usuario.create({
            data: {
                nome,
                email,
                senha_hash,
                tipo_usuario: tipo_usuario as TipoUsuario // Tipagem estrita
            }
        });

        res.status(201).json({ message: 'Usuário criado com sucesso', id_usuario: usuario.id_usuario });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, senha } = req.body;

        const usuario = await prisma.usuario.findUnique({ where: { email } });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        const validPassword = await bcrypt.compare(senha, usuario.senha_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Senha incorreta.' });
        }

        // Gera o Token JWT
        const token = jwt.sign(
            { id: usuario.id_usuario, tipo: usuario.tipo_usuario },
            process.env.JWT_SECRET || 'secret_padrao',
            { expiresIn: '1d' }
        );

        res.json({ message: 'Login efetuado com sucesso', token, tipo_usuario: usuario.tipo_usuario });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
};