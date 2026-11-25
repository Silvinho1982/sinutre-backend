import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { env } from '../config/env';
import { publicUser } from '../services/profile.service';
import { HttpError } from '../errors/HttpError';
import { loginSchema, registerSchema } from '../validators/schemas';

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

function signToken(userId: number): string {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: '7d' });
}

export function authProviders(_req: Request, res: Response) {
  return res.json({ github: env.github.enabled, credentials: true });
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = registerSchema.parse(req.body ?? {});

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, 'Já existe uma conta com este e-mail.', {
      email: 'Este e-mail já está cadastrado.',
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  return res.status(201).json({
    token: signToken(user.id),
    user: publicUser(user),
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body ?? {});

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash) {
    throw new HttpError(401, 'E-mail ou senha incorretos.');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new HttpError(401, 'E-mail ou senha incorretos.');
  }

  return res.json({
    token: signToken(user.id),
    user: publicUser(user),
  });
}

export async function logout(_req: Request, res: Response) {
  // A autenticação é stateless (JWT). O cliente descarta o token.
  return res.json({ ok: true });
}

// GET /auth/github — redireciona para a autorização do GitHub.
export async function redirectToGithub(_req: Request, res: Response) {
  if (!env.github.enabled) {
    throw new HttpError(
      503,
      'Login com GitHub não está configurado neste ambiente. Use e-mail e senha.',
    );
  }

  const params = new URLSearchParams({
    client_id: env.github.clientId,
    redirect_uri: env.github.callbackUrl,
    scope: 'read:user',
  });

  return res.redirect(`${GITHUB_AUTHORIZE_URL}?${params.toString()}`);
}

// GET /auth/github/callback — troca o code, cria/atualiza o usuário e emite o JWT.
export async function githubCallback(req: Request, res: Response) {
  if (!env.github.enabled) {
    return res.redirect(`${env.frontendUrls[0]}/login?error=github_nao_configurado`);
  }

  const code = req.query.code as string | undefined;
  if (!code) {
    return res.redirect(`${env.frontendUrls[0]}/login?error=github_code_ausente`);
  }

  try {
    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.github.clientId,
        client_secret: env.github.clientSecret,
        code,
        redirect_uri: env.github.callbackUrl,
      }),
    });

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      error?: string;
    };

    if (!tokenData.access_token) {
      return res.redirect(`${env.frontendUrls[0]}/login?error=github_token`);
    }

    const userResponse = await fetch(GITHUB_USER_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'sinutre-back',
      },
    });

    const githubUser = (await userResponse.json()) as {
      id: number;
      login: string;
      name: string | null;
      avatar_url: string | null;
    };

    const user = await prisma.user.upsert({
      where: { githubId: String(githubUser.id) },
      update: {
        githubLogin: githubUser.login,
        name: githubUser.name ?? githubUser.login,
        avatarUrl: githubUser.avatar_url ?? undefined,
      },
      create: {
        githubId: String(githubUser.id),
        githubLogin: githubUser.login,
        name: githubUser.name ?? githubUser.login,
        avatarUrl: githubUser.avatar_url ?? undefined,
      },
    });

    const token = signToken(user.id);
    return res.redirect(
      `${env.frontendUrls[0]}/login?token=${encodeURIComponent(token)}`,
    );
  } catch (error) {
    console.error('[github oauth]', error);
    return res.redirect(`${env.frontendUrls[0]}/login?error=github_falhou`);
  }
}
