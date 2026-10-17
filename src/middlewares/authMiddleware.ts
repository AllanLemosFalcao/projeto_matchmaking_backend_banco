import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estende a interface Request do Express para incluir o id_usuario
export interface AuthRequest extends Request {
    usuarioId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];

    // RESOLVE O ERRO TS2769: Verifica se o token realmente extraído é uma string válida
    if (!token) {
        return res.status(401).json({ error: 'Formato de token inválido' });
    }

    try {
        // RESOLVE O ERRO TS2352: Converte para unknown primeiro, e depois para o formato esperado
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_padrao') as unknown as { id: string };
        
        req.usuarioId = decoded.id; // Injeta o ID do usuário na requisição
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};