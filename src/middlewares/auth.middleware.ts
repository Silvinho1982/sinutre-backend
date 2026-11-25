import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

// Lê o JWT do header Authorization: Bearer <token> e injeta req.userId.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação ausente.' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, env.jwtSecret) as unknown as {
      sub?: number | string;
    };

    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: 'Token inválido.' });
    }

    req.userId = userId;
    return next();
  } catch {
    return res.status(401).json({ error: 'Sessão expirada ou token inválido.' });
  }
}
