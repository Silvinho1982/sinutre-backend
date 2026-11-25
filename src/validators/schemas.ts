import { z } from 'zod';
import { HttpError } from '../errors/HttpError';
import { LEVEL_CHOICES, MEAL_CHOICES } from '../constants/enums';

interface FieldMessages {
  required?: string;
  invalid?: string;
  min?: string;
  max?: string;
  integer?: string;
}

/**
 * Converte valores de formulário em números, recusando campos vazios.
 * Erros são traduzidos para mensagens em português e devolvidos campo a campo.
 */
function numberField(
  label: string,
  min: number,
  max: number,
  integer = false,
  messages: FieldMessages = {},
) {
  let schema = z
    .number({
      required_error: messages.required ?? `${label} é obrigatório.`,
      invalid_type_error: messages.invalid ?? `${label} deve ser um número.`,
    })
    .finite(messages.invalid ?? `${label} deve ser um número válido.`)
    .min(min, messages.min ?? `${label} deve ser maior ou igual a ${min}.`)
    .max(max, messages.max ?? `${label} deve ser menor ou igual a ${max}.`);

  if (integer) {
    schema = schema.int(messages.integer ?? `${label} deve ser um número inteiro.`);
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
  caloriesPer100g: numberField('Calorias (kcal/100g)', 0, 1000, false, {
    required: 'Informe as calorias por 100 g.',
    min: 'As calorias não podem ser negativas.',
    max: 'As calorias devem ser no máximo 1.000 kcal por 100 g.',
  }),
  carbsPer100g: numberField('Carboidratos (g/100g)', 0, 100, false, {
    required: 'Informe os carboidratos por 100 g.',
    min: 'Os carboidratos não podem ser negativos.',
    max: 'Os carboidratos devem ser no máximo 100 g por 100 g.',
  }),
  proteinPer100g: numberField('Proteínas (g/100g)', 0, 100, false, {
    required: 'Informe as proteínas por 100 g.',
    min: 'As proteínas não podem ser negativas.',
    max: 'As proteínas devem ser no máximo 100 g por 100 g.',
  }),
  fatPer100g: numberField('Gorduras (g/100g)', 0, 100, false, {
    required: 'Informe as gorduras por 100 g.',
    min: 'As gorduras não podem ser negativas.',
    max: 'As gorduras devem ser no máximo 100 g por 100 g.',
  }),
});

export const profileSchema = z.object({
  targetDietDaily: numberField('Meta calórica diária', 500, 20000, true, {
    required: 'Informe a meta calórica diária.',
    integer: 'A meta calórica deve ser um número inteiro.',
    min: 'A meta calórica deve ser de no mínimo 500 kcal.',
    max: 'A meta calórica deve ser de no máximo 20.000 kcal.',
  }),
  height: numberField('Altura (cm)', 80, 250, false, {
    required: 'Informe a altura.',
    min: 'A altura deve ser de no mínimo 80 cm.',
    max: 'A altura deve ser de no máximo 250 cm.',
  }),
  weight: numberField('Peso (kg)', 20, 400, false, {
    required: 'Informe o peso.',
    min: 'O peso deve ser de no mínimo 20 kg.',
    max: 'O peso deve ser de no máximo 400 kg.',
  }),
  levelActivity: z.enum(LEVEL_CHOICES, {
    errorMap: () => ({ message: 'Selecione um nível de atividade válido.' }),
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
      errorMap: () => ({ message: 'Selecione um tipo de refeição válido.' }),
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
          foodId: numberField('Alimento', 1, Number.MAX_SAFE_INTEGER, true, {
            required: 'Selecione um alimento.',
            integer: 'Selecione um alimento válido.',
            min: 'Selecione um alimento válido.',
          }),
          grams: numberField('Quantidade em gramas', 1, 5000, false, {
            required: 'Informe a quantidade em gramas.',
            min: 'A quantidade deve ser de no mínimo 1 g.',
            max: 'A quantidade deve ser de no máximo 5.000 g.',
          }),
        }),
        { required_error: 'Adicione pelo menos um alimento.' },
      )
      .min(1, 'Adicione pelo menos um alimento à refeição.'),
  })
  .refine(
    (data) => new Set(data.items.map((item) => item.foodId)).size === data.items.length,
    {
      message: 'Um alimento não pode ser adicionado duas vezes na mesma refeição.',
      path: ['items'],
    },
  );

export function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body ?? {});

  if (!result.success) {
    const details: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || 'form';
      if (!details[key]) details[key] = issue.message;
    }
    throw new HttpError(400, 'Dados inválidos. Verifique os campos destacados.', details);
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
