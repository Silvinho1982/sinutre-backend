import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import {
  createFood,
  deleteFood,
  getFood,
  listFoods,
  updateFood,
} from '../controllers/foods.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const foodRouter = Router();

foodRouter.use(requireAuth);

foodRouter.get('/', asyncHandler(listFoods));
foodRouter.get('/:id', asyncHandler(getFood));
foodRouter.post('/', asyncHandler(createFood));
foodRouter.put('/:id', asyncHandler(updateFood));
foodRouter.delete('/:id', asyncHandler(deleteFood));
