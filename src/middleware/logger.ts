import { Request, Response, NextFunction } from 'express';

export function reqResConsoleLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  console.log(`➡️  [REQ] ${req.method} ${req.originalUrl}`);
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`⬅️  [RES] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
  });
  next();
}
