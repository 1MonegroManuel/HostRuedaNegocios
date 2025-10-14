import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

client.collectDefaultMetrics({ prefix: 'api_' });

const httpDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP latency',
  labelNames: ['method','route','status'] as const,
  buckets: [50,100,200,400,800,1600,3200]
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    httpDuration.labels(req.method, req.route?.path ?? req.path, String(res.statusCode))
      .observe(Date.now() - start);
  });
  next();
}

export async function metricsEndpoint(_req: Request, res: Response) {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
}
