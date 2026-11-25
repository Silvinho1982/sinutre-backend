// Utilitários de data e indicadores nutricionais.

export function dateKey(date: Date, timeZone: string): string {
  // en-CA produz o formato YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function lastNDays(now: Date, timeZone: string, days: number): string[] {
  const keys: string[] = [];
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    keys.push(dateKey(new Date(now.getTime() - offset * MS_PER_DAY), timeZone));
  }

  return keys;
}

export function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export interface ImcClassification {
  value: number;
  label: string;
  tone: 'low' | 'normal' | 'overweight' | 'obesity';
  description: string;
  min: number;
  max: number | null;
}

export function calculateImc(weightKg: number, heightCm: number): ImcClassification {
  const heightM = heightCm / 100;
  const value = round(weightKg / (heightM * heightM), 1);

  if (value < 18.5) {
    return {
      value,
      label: 'Abaixo do peso',
      tone: 'low',
      description: 'IMC abaixo de 18,5 — procure orientação nutricional.',
      min: 0,
      max: 18.5,
    };
  }

  if (value < 25) {
    return {
      value,
      label: 'Peso normal',
      tone: 'normal',
      description: 'IMC entre 18,5 e 24,9 — faixa considerada saudável.',
      min: 18.5,
      max: 25,
    };
  }

  if (value < 30) {
    return {
      value,
      label: 'Sobrepeso',
      tone: 'overweight',
      description: 'IMC entre 25 e 29,9 — atenção ao consumo calórico.',
      min: 25,
      max: 30,
    };
  }

  return {
    value,
    label: 'Obesidade',
    tone: 'obesity',
    description: 'IMC igual ou superior a 30 — acompanhamento profissional recomendado.',
    min: 30,
    max: null,
  };
}

export function startOfWindow(now: Date, days: number): Date {
  // Margem extra para cobrir fusos horários ao consultar o banco.
  return new Date(now.getTime() - (days + 2) * 24 * 60 * 60 * 1000);
}
