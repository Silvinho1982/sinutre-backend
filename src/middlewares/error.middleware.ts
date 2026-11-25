import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { HttpError } from '../errors/HttpError';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({
      error: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
  }

  if (error instanceof ZodError) {
    const details: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = issue.path.join('.') || 'form';
      details[key] = issue.message;
    }
    return res.status(400).json({ error: 'Dados inválidos.', details });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Já existe um registro com este valor.' });
    }
    if (error.code === 'P2003' || error.code === 'P2014') {
      return res.status(409).json({
        error: 'Este registro está em uso e não pode ser excluído.',
      });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Registro não encontrado.' });
    }
  }

  console.error('[erro não tratado]', error);
  return res.status(500).json({
    error: 'Erro interno do servidor. Tente novamente em instantes.',
  });
}
