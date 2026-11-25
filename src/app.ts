import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { authRoutes } from './routes/auth.routes';
import { mealsRoutes } from './routes/meals.routes';
import { foodRouter } from './routes/food.routes';
import { profileRoutes } from './routes/profile.routes';
import { metricsRoutes } from './routes/metrics.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { HttpError } from './errors/HttpError';

export const app = express();

app.set('trust proxy', 1);

app.use(
  cors({
    origin(origin, callback) {
      // Requisições sem Origin (curl, healthcheck) e origens configuradas são aceitas.
      if (!origin || env.frontendUrls.includes('*') || env.frontendUrls.includes(origin)) {
        return callback(null, true);
      }
      return callback(new HttpError(403, `Origem não permitida pelo CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'sinutre-back',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use('/auth', authRoutes);
app.use('/meals', mealsRoutes);
app.use('/foods', foodRouter);
app.use('/profile', profileRoutes);
app.use('/metrics', metricsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
