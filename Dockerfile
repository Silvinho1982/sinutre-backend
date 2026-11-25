# Imagem de produção do backend SiNutre
FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# O schema precisa existir antes do postinstall (prisma generate).
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Aplica as migrations pendentes e inicia a API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
