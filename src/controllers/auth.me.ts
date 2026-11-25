import { Request, Response } from 'express';
import { getProfileData } from '../services/profile.service';

export async function me(req: Request, res: Response) {
  const data = await getProfileData(req.userId!);
  return res.json(data);
}
