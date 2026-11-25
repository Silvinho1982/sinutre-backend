import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { me } from '../controllers/auth.me';
import {
  authProviders,
  githubCallback,
  login,
  logout,
  redirectToGithub,
  register,
} from '../controllers/auth.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const authRoutes = Router();

authRoutes.get('/providers', authProviders);
authRoutes.post('/register', asyncHandler(register));
authRoutes.post('/login', asyncHandler(login));
authRoutes.post('/logout', asyncHandler(logout));

authRoutes.get('/github', asyncHandler(redirectToGithub));
authRoutes.get('/github/callback', asyncHandler(githubCallback));
authRoutes.get('/me', requireAuth, asyncHandler(me));
