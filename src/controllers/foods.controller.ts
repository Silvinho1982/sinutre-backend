import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { HttpError } from '../errors/HttpError';
import { foodSchema, parseId } from '../validators/schemas';

const MAX_FOODS = 200;

export async function listFoods(req: Request, res: Response) {
  const userId = req.userId!;
  const search = String(req.query.search ?? '').trim();

  const foods = await prisma.food.findMany({
    where: {
      userId,
      ...(search
        ? { name: { contains: search, mode: Prisma.QueryMode.insensitive } }
        : {}),
    },
    take: search ? 10 : MAX_FOODS,
    orderBy: { name: 'asc' },
  });

  return res.json(foods);
}

export async function getFood(req: Request, res: Response) {
  const id = parseId(req.params.id, 'Alimento');
  const food = await prisma.food.findFirst({ where: { id, userId: req.userId! } });

  if (!food) {
    throw new HttpError(404, 'Alimento não encontrado.');
  }

  return res.json(food);
}

export async function createFood(req: Request, res: Response) {
  const data = foodSchema.parse(req.body ?? {});

  const food = await prisma.food.create({
    data: { ...data, userId: req.userId! },
  });

  return res.status(201).json(food);
}

export async function updateFood(req: Request, res: Response) {
  const id = parseId(req.params.id, 'Alimento');
  const data = foodSchema.parse(req.body ?? {});

  const existing = await prisma.food.findFirst({ where: { id, userId: req.userId! } });
  if (!existing) {
    throw new HttpError(404, 'Alimento não encontrado.');
  }

  const food = await prisma.food.update({ where: { id }, data });
  return res.json(food);
}

export async function deleteFood(req: Request, res: Response) {
  const id = parseId(req.params.id, 'Alimento');

  const existing = await prisma.food.findFirst({ where: { id, userId: req.userId! } });
  if (!existing) {
    throw new HttpError(404, 'Alimento não encontrado.');
  }

  const usage = await prisma.mealFood.count({ where: { foodId: id } });
  if (usage > 0) {
    throw new HttpError(
      409,
      'Este alimento já foi usado em refeições e não pode ser excluído. Edite-o para manter o histórico consistente.',
    );
  }

  await prisma.food.delete({ where: { id } });
  return res.status(204).send();
}
