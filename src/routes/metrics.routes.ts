import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getDashboard, getMetrics } from '../controllers/metrics.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const metricsRoutes = Router();

metricsRoutes.use(requireAuth);

metricsRoutes.get('/dashboard', asyncHandler(getDashboard));
metricsRoutes.get('/summary', asyncHandler(getMetrics));
