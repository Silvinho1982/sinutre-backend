import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { getProfileData } from '../services/profile.service';
import { profileSchema } from '../validators/schemas';

export async function getProfile(req: Request, res: Response) {
  const data = await getProfileData(req.userId!);
  return res.json(data);
}

export async function saveProfile(req: Request, res: Response) {
  const userId = req.userId!;
  const { targetDietDaily, height, weight, levelActivity } = profileSchema.parse(
    req.body ?? {},
  );

  await prisma.$transaction(async (tx) => {
    const activeHealth = await tx.healthData.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (activeHealth) {
      await tx.healthData.update({
        where: { id: activeHealth.id },
        data: { targetDietDaily, levelActivity },
      });
    } else {
      await tx.healthData.create({
        data: { targetDietDaily, levelActivity, userId, isActive: true },
      });
    }

    const latestWeight = await tx.weightLog.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (latestWeight) {
      await tx.weightLog.update({
        where: { id: latestWeight.id },
        data: { height, weight },
      });
    } else {
      await tx.weightLog.create({ data: { height, weight, userId } });
    }
  });

  const data = await getProfileData(userId);
  return res.json(data);
}
