import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { corsMiddleware } from './config/cors';
import { apiLimiter } from './middleware/rateLimit';
import { metricsEndpoint, metricsMiddleware } from './config/metrics';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { reqResConsoleLogger } from './middleware/logger';

const app = express();

app.use(reqResConsoleLogger);

app.use(helmet());
app.use(corsMiddleware);

// app.ts
if (process.env.NODE_ENV !== 'test') {
  app.use(apiLimiter);
}

app.use(metricsMiddleware);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

app.get('/health', (_req, res) =>
  res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() })
);
app.get('/metrics', metricsEndpoint);

app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'Rueda de Negocios API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: { auth: '/api/auth', eventos: '/api/eventos', empresas: '/api/empresas' }
  });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
