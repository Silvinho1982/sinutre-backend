import 'dotenv/config';

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== '' ? value : undefined;
}

function required(name: string): string {
  const value = optional(name);
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

const githubClientId = optional('GITHUB_CLIENT_ID');
const githubClientSecret = optional('GITHUB_CLIENT_SECRET');
const githubCallbackUrl = optional('GITHUB_CALLBACK_URL');

export const env = {
  port: Number(process.env.PORT ?? 3333),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: required('JWT_SECRET'),
  // Lista separada por vírgula. Aceita múltiplas origens (local + produção).
  frontendUrls: (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  timezone: process.env.APP_TIMEZONE ?? 'America/Sao_Paulo',
  github: {
    enabled: Boolean(githubClientId && githubClientSecret && githubCallbackUrl),
    clientId: githubClientId ?? '',
    clientSecret: githubClientSecret ?? '',
    callbackUrl: githubCallbackUrl ?? 'http://localhost:3333/auth/github/callback',
  },
};
