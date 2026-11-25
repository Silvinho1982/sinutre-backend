import { z } from 'zod';
import { HttpError } from '../errors/HttpError';
import { LEVEL_CHOICES, MEAL_CHOICES } from '../constants/enums';

/**
 * Converte valores de formulário em números, recusando campos vazios.
 * Erros são traduzidos para mensagens em português e devolvidos campo a campo.
 */
function numberField(label: string, min: number, max: number, integer = false) {
  let schema = z
    .number({
      required_error: `${label} é obrigatório.`,
      invalid_type_error: `${label} deve ser um número.`,
    })
    .finite(`${label} deve ser um número válido.`)
    .min(min, `${label} deve ser maior ou igual a ${min}.`)
    .max(max, `${label} deve ser menor ou igual a ${max}.`);

  if (integer) {
    schema = schema.int(`${label} deve ser um número inteiro.`);
  }

  return z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return undefined;
    if (typeof value === 'string') {
      const normalized = value.trim().replace(',', '.');
      return normalized === '' ? undefined : Number(normalized);
    }
    return value;
  }, schema);
}

function textField(label: string, min: number, max: number) {
  return z
    .string({
      required_error: `${label} é obrigatório.`,
      invalid_type_error: `${label} deve ser um texto.`,
    })
    .trim()
    .min(min, `${label} deve ter pelo menos ${min} caracteres.`)
    .max(max, `${label} deve ter no máximo ${max} caracteres.`);
}

export const foodSchema = z.object({
  name: textField('Nome', 2, 120),
  caloriesPer100g: numberField('Calorias (kcal/100g)', 0, 1000),
  carbsPer100g: numberField('Carboidratos (g/100g)', 0, 100),
  proteinPer100g: numberField('Proteínas (g/100g)', 0, 100),
  fatPer100g: numberField('Gorduras (g/100g)', 0, 100),
});

export const profileSchema = z.object({
  targetDietDaily: numberField('Meta calórica diária', 500, 20000, true),
  height: numberField('Altura (cm)', 80, 250),
  weight: numberField('Peso (kg)', 20, 400),
  levelActivity: z.enum(LEVEL_CHOICES, {
    required_error: 'Nível de atividade é obrigatório.',
    invalid_type_error: 'Selecione um nível de atividade válido.',
  }),
});

export const registerSchema = z.object({
  name: textField('Nome', 2, 100),
  email: z
    .string({ required_error: 'E-mail é obrigatório.' })
    .trim()
    .toLowerCase()
    .email('Informe um e-mail válido.'),
  password: z
    .string({ required_error: 'Senha é obrigatória.' })
    .min(8, 'A senha deve ter pelo menos 8 caracteres.')
    .max(72, 'A senha deve ter no máximo 72 caracteres.')
    .regex(/[A-Za-z]/, 'A senha deve conter pelo menos uma letra.')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número.'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'E-mail é obrigatório.' })
    .trim()
    .toLowerCase()
    .email('Informe um e-mail válido.'),
  password: z
    .string({ required_error: 'Senha é obrigatória.' })
    .min(1, 'Senha é obrigatória.'),
});

export const mealSchema = z
  .object({
    type: z.enum(MEAL_CHOICES, {
      required_error: 'Tipo da refeição é obrigatório.',
      invalid_type_error: 'Tipo da refeição inválido.',
    }),
    eatTime: z
      .string({ required_error: 'Data e horário são obrigatórios.' })
      .trim()
      .min(1, 'Data e horário são obrigatórios.')
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: 'Informe uma data e horário válidos.',
      }),
    description: z
      .string()
      .trim()
      .max(200, 'A descrição deve ter no máximo 200 caracteres.')
      .optional()
      .nullable(),
    items: z
      .array(
        z.object({
          foodId: numberField('Alimento', 1, Number.MAX_SAFE_INTEGER, true),
          grams: numberField('Quantidade em gramas', 1, 5000),
        }),
        { required_error: 'Adicione pelo menos um alimento.' }
      )
      .min(1, 'Adicione pelo menos um alimento à refeição.'),
  })
  .refine(
    (data) => new Set(data.items.map((item) => item.foodId)).size === data.items.length,
    { message: 'Um alimento não pode ser adicionado duas vezes na mesma refeição.', path: ['items'] }
  );

export function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body ?? {});

  if (!result.success) {
    const details: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || 'form';
      if (!details[key]) details[key] = issue.message;
    }
    throw new HttpError(
      400,
      'Dados inválidos. Verifique os campos destacados.',
      details,
    );
  }

  return result.data;
}

export function parseId(value: string | undefined, label = 'ID'): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${label} inválido.`);
  }
  return id;
}
