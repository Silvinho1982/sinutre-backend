# sinutre-back

Backend do **SiNutre — Sistema de Ingestão de Macronutrientes**.

API REST em **TypeScript + Express + Prisma + PostgreSQL**, com autenticação
JWT (e-mail/senha e GitHub OAuth opcional), CRUD de alimentos com validação,
dados complementares do usuário e endpoints de métricas (IMC e média calórica).

## Produção

- **API:** _será preenchido após o deploy no Railway_
- **Healthcheck:** `GET /health`

## Stack

- Node.js 22 + TypeScript
- Express 4
- Prisma 5 + PostgreSQL
- Zod (validação de entrada)
- JWT + bcryptjs
- Docker (deploy no Railway)

## Rodando localmente

```bash
npm install
cp .env.example .env      # configure DATABASE_URL, JWT_SECRET etc.
npx prisma migrate deploy # aplica as migrations no PostgreSQL
npm run dev               # http://localhost:3333
```

> O projeto usa PostgreSQL. Para subir um banco local rapidamente:
> `docker run --name sinutre-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sinutre -p 5432:5432 -d postgres:16`

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | sim | String de conexão PostgreSQL |
| `JWT_SECRET` | sim | Segredo para assinar os tokens JWT |
| `PORT` | não | Porta da API (padrão `3333`) |
| `FRONTEND_URL` | não | Origem(ns) permitida(s) no CORS, separadas por vírgula |
| `APP_TIMEZONE` | não | Fuso para agrupar refeições por dia (padrão `America/Sao_Paulo`) |
| `GITHUB_CLIENT_ID` | não | Login com GitHub (opcional) |
| `GITHUB_CLIENT_SECRET` | não | Login com GitHub (opcional) |
| `GITHUB_CALLBACK_URL` | não | URL de callback do OAuth App |

## Endpoints

### Autenticação

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/auth/providers` | Indica quais provedores estão habilitados |
| `POST` | `/auth/register` | Cria conta (`name`, `email`, `password`) e retorna JWT |
| `POST` | `/auth/login` | Login por e-mail e senha |
| `POST` | `/auth/logout` | Logout (JWT é descartado pelo cliente) |
| `GET` | `/auth/me` | Usuário autenticado + perfil complementar |
| `GET` | `/auth/github` | Inicia OAuth do GitHub (se configurado) |
| `GET` | `/auth/github/callback` | Callback do OAuth do GitHub |

### Alimentos (CRUD)

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/foods` | Lista alimentos (até 200); `?search=` filtra por nome |
| `GET` | `/foods/:id` | Detalhe de um alimento |
| `POST` | `/foods` | Cadastra alimento com validação |
| `PUT` | `/foods/:id` | Altera alimento com validação |
| `DELETE` | `/foods/:id` | Exclui alimento (bloqueado se usado em refeição) |

### Perfil

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/profile` | Dados do usuário + meta calórica, altura, peso, atividade e IMC |
| `PUT` | `/profile` | Cadastra/atualiza meta, altura, peso e nível de atividade |

### Refeições

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/meals` | Lista refeições com totais de macros |
| `POST` | `/meals` | Cria refeição com itens e quantidades |
| `DELETE` | `/meals/:id` | Exclui uma refeição |

### Métricas

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/metrics/dashboard` | Consumo do dia, meta, percentual e flag de meta ultrapassada |
| `GET` | `/metrics/summary` | IMC classificado + média calórica dos últimos 7 dias |

## Validação e erros

Todas as entradas passam por schemas Zod. Em caso de erro a API responde com
JSON no formato:

```json
{
  "error": "Dados inválidos. Verifique os campos destacados.",
  "details": {
    "caloriesPer100g": "Calorias (kcal/100g) é obrigatório."
  }
}
```

Códigos usados: `400` (validação), `401` (autenticação), `404` (não encontrado),
`409` (conflito/registro em uso) e `500` (erro inesperado).

## Deploy no Railway

1. Crie um projeto e adicione um banco **PostgreSQL**.
2. Aponte o serviço para este repositório (o `Dockerfile` é detectado).
3. Configure as variáveis `JWT_SECRET`, `FRONTEND_URL` e
   `DATABASE_URL=${{Postgres.DATABASE_URL}}`.
4. Gere o domínio público. O container executa `prisma migrate deploy` no start.

## Scripts

```bash
npm run dev        # desenvolvimento com tsx watch
npm run build      # prisma generate + tsc
npm start          # migrate deploy + dist/index.js
npm run prisma:studio
```
