export const GENDER_CHOICES = [
  'MASCULINO',
  'FEMININO',
  'NAO_ESPECIFICADO',
] as const;
export type GenderChoice = (typeof GENDER_CHOICES)[number];

export const MEAL_CHOICES = [
  'snack',
  'lunch',
  'breakfast',
  'dinner',
  'other',
] as const;
export type MealChoice = (typeof MEAL_CHOICES)[number];

export const LEVEL_CHOICES = [
  'SEDENTARIO',
  'LEVEMENTE_ATIVO',
  'MODERADAMENTE_ATIVO',
  'MUITO_ATIVO',
  'EXTREMAMENTE_ATIVO',
] as const;
export type LevelChoice = (typeof LEVEL_CHOICES)[number];

export const LEVEL_ACTIVITY_LABELS: Record<LevelChoice, string> = {
  SEDENTARIO: 'Sedentário',
  LEVEMENTE_ATIVO: 'Levemente ativo',
  MODERADAMENTE_ATIVO: 'Moderadamente ativo',
  MUITO_ATIVO: 'Muito ativo',
  EXTREMAMENTE_ATIVO: 'Extremamente ativo',
};
