import { Router } from 'express';
import { createMeal, deleteMeal, meals } from '../controllers/meals.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

export const mealsRoutes = Router();

mealsRoutes.use(requireAuth);

mealsRoutes.get('/', asyncHandler(meals));
mealsRoutes.post('/', asyncHandler(createMeal));
mealsRoutes.delete('/:id', asyncHandler(deleteMeal));
