import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getProfile, saveProfile } from '../controllers/profile.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const profileRoutes = Router();

profileRoutes.use(requireAuth);

profileRoutes.get('/', asyncHandler(getProfile));
profileRoutes.put('/', asyncHandler(saveProfile));
