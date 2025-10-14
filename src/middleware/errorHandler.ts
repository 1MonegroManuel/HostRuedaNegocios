import { Request, Response, NextFunction } from 'express';
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  const status = err?.status || 500;
  const msg = process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : (err?.message || 'Error');
  console.error('Unhandled error:', { url: req.originalUrl, method: req.method, message: err?.message });
  res.status(status).json({ error: msg });
}
