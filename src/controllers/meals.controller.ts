import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { HttpError } from '../errors/HttpError';
import { mealSchema, parseId } from '../validators/schemas';

function mealTotals(
  foods: Array<{ foodG: number; calories: number; carbs: number; protein: number; fat: number }>,
) {
  return foods.reduce(
    (acc, item) => {
      acc.grams += item.foodG;
      acc.calories += item.calories;
      acc.carbs += item.carbs;
      acc.proteins += item.protein;
      acc.fats += item.fat;
      return acc;
    },
    { grams: 0, calories: 0, carbs: 0, proteins: 0, fats: 0 },
  );
}

export async function meals(req: Request, res: Response) {
  const meals = await prisma.meal.findMany({
    where: { userId: req.userId! },
    include: {
      foods: {
        include: { food: true },
      },
    },
    orderBy: { eatTime: 'desc' },
    take: 200,
  });

  const result = meals.map((meal) => ({
    id: meal.id,
    name: meal.description,
    type: meal.type,
    createdAt: meal.createdAt,
    eatTime: meal.eatTime,
    totals: mealTotals(meal.foods),
    items: meal.foods,
  }));

  return res.json(result);
}

export async function createMeal(req: Request, res: Response) {
  const userId = req.userId!;
  const { type, eatTime, description, items } = mealSchema.parse(req.body ?? {});

  const meal = await prisma.$transaction(async (tx) => {
    const foods = await tx.food.findMany({
      where: {
        id: { in: items.map((item) => item.foodId) },
        userId,
      },
    });

    if (foods.length !== items.length) {
      throw new HttpError(
        400,
        'Um ou mais alimentos informados não foram encontrados.',
        { items: 'Selecione apenas alimentos cadastrados por você.' },
      );
    }

    const created = await tx.meal.create({
      data: {
        type,
        eatTime: new Date(eatTime),
        description: description ?? null,
        userId,
      },
    });

    await tx.mealFood.createMany({
      data: items.map((item) => {
        const food = foods.find((candidate) => candidate.id === item.foodId)!;
        const factor = item.grams / 100;

        return {
          mealId: created.id,
          foodId: food.id,
          foodG: item.grams,
          calories: food.caloriesPer100g * factor,
          carbs: food.carbsPer100g * factor,
          protein: food.proteinPer100g * factor,
          fat: food.fatPer100g * factor,
        };
      }),
    });

    return created;
  });

  return res.status(201).json(meal);
}

export async function deleteMeal(req: Request, res: Response) {
  const id = parseId(req.params.id, 'Refeição');
  const meal = await prisma.meal.findFirst({
    where: { id, userId: req.userId! },
    select: { id: true },
  });

  if (!meal) {
    throw new HttpError(404, 'Refeição não encontrada.');
  }

  await prisma.meal.delete({ where: { id } });
  return res.status(204).send();
}
