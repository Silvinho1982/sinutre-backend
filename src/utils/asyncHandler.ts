import { NextFunction, Request, RequestHandler, Response } from 'express';

// O Express 4 não encaminha rejeições de promises para o error handler.
// Este wrapper garante que erros assíncronos cheguem ao middleware global.
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
