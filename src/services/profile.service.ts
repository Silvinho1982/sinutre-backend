import { prisma } from '../prisma';
import { HttpError } from '../errors/HttpError';
import { calculateImc, ImcClassification } from '../utils/nutrition';
import { LEVEL_ACTIVITY_LABELS, LevelChoice } from '../constants/enums';

export interface PublicUser {
  id: number;
  name: string;
  email: string | null;
  githubLogin: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface ProfileDto {
  targetDietDaily: number | null;
  height: number | null;
  weight: number | null;
  levelActivity: LevelChoice | null;
  levelActivityLabel: string | null;
  imc: ImcClassification | null;
  hasProfile: boolean;
  updatedAt: Date | null;
}

export interface ProfileResponse {
  user: PublicUser;
  profile: ProfileDto;
}

export function publicUser(user: {
  id: number;
  name: string;
  email: string | null;
  githubLogin: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    githubLogin: user.githubLogin,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

export async function getProfileData(userId: number): Promise<ProfileResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      healthData: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      weightLogs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new HttpError(404, 'Usuário não encontrado.');
  }

  const health = user.healthData[0];
  const weightLog = user.weightLogs[0];
  const levelActivity = (health?.levelActivity as LevelChoice | undefined) ?? null;

  const profile: ProfileDto = {
    targetDietDaily: health?.targetDietDaily ?? null,
    height: weightLog?.height ?? null,
    weight: weightLog?.weight ?? null,
    levelActivity,
    levelActivityLabel: levelActivity ? LEVEL_ACTIVITY_LABELS[levelActivity] : null,
    imc:
      weightLog && weightLog.height > 0
        ? calculateImc(weightLog.weight, weightLog.height)
        : null,
    hasProfile: Boolean(health && weightLog),
    updatedAt: health?.createdAt ?? weightLog?.createdAt ?? null,
  };

  return { user: publicUser(user), profile };
}

export async function getTargetDietDaily(userId: number): Promise<number | null> {
  const health = await prisma.healthData.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'desc' },
    select: { targetDietDaily: true },
  });

  return health?.targetDietDaily ?? null;
}
