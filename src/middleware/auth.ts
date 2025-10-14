import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type JwtUser = { sub: string; role: 'personal'|'dueño'|'admin'; username: string; email: string };

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers['authorization'];
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtUser;
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function authorizeRoles(...roles: Array<'personal'|'dueño'|'admin'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const u = (req as any).user as JwtUser | undefined;
    if (!u) return res.status(401).json({ error: 'No autenticado' });
    if (!roles.includes(u.role)) return res.status(403).json({ error: 'No autorizado' });
    next();
  };
}
