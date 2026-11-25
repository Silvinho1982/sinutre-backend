import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { env } from '../config/env';
import { getProfileData } from '../services/profile.service';
import {
  dateKey,
  lastNDays,
  round,
  startOfWindow,
} from '../utils/nutrition';

interface Totals {
  calories: number;
  carbs: number;
  proteins: number;
  fats: number;
}

function emptyTotals(): Totals {
  return { calories: 0, carbs: 0, proteins: 0, fats: 0 };
}

function sumMealFoods(
  foods: Array<{ calories: number; carbs: number; protein: number; fat: number }>,
): Totals {
  return foods.reduce((acc, item) => {
    acc.calories += item.calories;
    acc.carbs += item.carbs;
    acc.proteins += item.protein;
    acc.fats += item.fat;
    return acc;
  }, emptyTotals());
}

function weekdayLabel(key: string): string {
  const date = new Date(`${key}T12:00:00Z`);
  const label = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(date);
  return label.replace('.', '');
}

function shortDate(key: string): string {
  const [, month, day] = key.split('-');
  return `${day}/${month}`;
}

export async function getDashboard(req: Request, res: Response) {
  const userId = req.userId!;
  const now = new Date();
  const todayKey = dateKey(now, env.timezone);

  const [meals, targetDietDaily, totalMeals] = await Promise.all([
    prisma.meal.findMany({
      where: { userId, eatTime: { gte: startOfWindow(now, 1) } },
      include: { foods: true },
      orderBy: { eatTime: 'desc' },
    }),
    prisma.healthData.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { targetDietDaily: true },
    }),
    prisma.meal.count({ where: { userId } }),
  ]);

  const todayMeals = meals.filter(
    (meal) => dateKey(meal.eatTime, env.timezone) === todayKey,
  );

  const consumed = todayMeals.reduce(
    (acc, meal) => {
      const totals = sumMealFoods(meal.foods);
      acc.calories += totals.calories;
      acc.carbs += totals.carbs;
      acc.proteins += totals.proteins;
      acc.fats += totals.fats;
      return acc;
    },
    emptyTotals(),
  );

  const target = targetDietDaily?.targetDietDaily ?? null;
  const calories = round(consumed.calories, 0);
  const exceedsTarget = target !== null && calories > target;

  return res.json({
    date: todayKey,
    targetDietDaily: target,
    hasTarget: target !== null,
    consumed: {
      calories,
      carbs: round(consumed.carbs),
      proteins: round(consumed.proteins),
      fats: round(consumed.fats),
    },
    remainingCalories: target === null ? null : Math.max(target - calories, 0),
    consumedPercentage:
      target === null || target === 0 ? null : round((calories / target) * 100, 1),
    exceeded: exceedsTarget,
    meals: {
      today: todayMeals.length,
      total: totalMeals,
    },
  });
}

export async function getMetrics(req: Request, res: Response) {
  const userId = req.userId!;
  const now = new Date();
  const keys = lastNDays(now, env.timezone, 7);

  const [meals, profile] = await Promise.all([
    prisma.meal.findMany({
      where: { userId, eatTime: { gte: startOfWindow(now, 7) } },
      include: { foods: true },
      orderBy: { eatTime: 'asc' },
    }),
    getProfileData(userId),
  ]);

  const caloriesByDay = new Map<string, number>(keys.map((key) => [key, 0]));

  for (const meal of meals) {
    const key = dateKey(meal.eatTime, env.timezone);
    if (!caloriesByDay.has(key)) continue;
    const totals = sumMealFoods(meal.foods);
    caloriesByDay.set(key, (caloriesByDay.get(key) ?? 0) + totals.calories);
  }

  const days = keys.map((key) => {
    const calories = round(caloriesByDay.get(key) ?? 0, 0);
    return {
      date: key,
      weekday: weekdayLabel(key),
      shortDate: shortDate(key),
      isToday: key === dateKey(now, env.timezone),
      calories,
    };
  });

  const totalCalories = days.reduce((acc, day) => acc + day.calories, 0);
  const averageCalories = round(totalCalories / days.length, 0);
  const target = profile.profile.targetDietDaily;

  let status: 'SEM_META' | 'ABAIXO' | 'DENTRO' | 'ACIMA' = 'SEM_META';
  let statusLabel = 'Meta ainda não cadastrada';

  if (target !== null) {
    const difference = averageCalories - target;
    const percentage = (averageCalories / target) * 100;

    if (percentage < 90) {
      status = 'ABAIXO';
      statusLabel = 'Abaixo da meta';
    } else if (percentage <= 110) {
      status = 'DENTRO';
      statusLabel = 'Dentro da meta';
    } else {
      status = 'ACIMA';
      statusLabel = 'Acima da meta';
    }
  }

  return res.json({
    imc: profile.profile.imc,
    profile: profile.profile,
    last7Days: {
      days,
      totalCalories,
      averageCalories,
      target,
      difference: target === null ? null : round(averageCalories - target, 0),
      percentageOfTarget:
        target === null || target === 0
          ? null
          : round((averageCalories / target) * 100, 1),
      status,
      statusLabel,
    },
  });
}
