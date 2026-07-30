# Thalya Modas API

API operacional da plataforma Thalya Modas, construída com Fastify 5,
TypeScript, Zod, Prisma e PostgreSQL.

## Responsabilidades atuais

- Autenticação JWT por bearer token ou cookie httpOnly.
- Cadastro, login, sessão e recuperação de senha.
- Onboarding de loja.
- Feature flags para desligamento controlado de módulos.
- Dashboard protegido.
- Fornecedores e responsáveis.
- Produtos, imagens WebP e movimentos de estoque.
- Pedidos de compra e recebimentos.
- Swagger/OpenAPI, trace ID, métricas e tratamento padronizado de erros.

## Arquitetura

```txt
src/
  app/http/             servidor, middlewares e rotas
  core/domain/          entidades, value objects e contratos
  core/application/     casos de uso
  core/infra/           autenticação, storage e persistência
  shared/               ambiente, paginação, RBAC e utilitários
tests/
  unit/
  integration/
prisma/
  schema.prisma
  migrations/
```

O driver `in-memory` é útil para desenvolvimento e testes rápidos. Com
`PERSISTENCE_DRIVER=postgres`, autenticação, onboarding e catálogo usam Prisma.
Os read models gerais do dashboard ainda são mantidos em memória.

## Ambiente

Crie `apps/api/.env` a partir de `.env.example`.

Variáveis essenciais:

```env
NODE_ENV="development"
HOST="0.0.0.0"
PORT="3333"
JWT_SECRET="uma-chave-local-com-pelo-menos-32-caracteres"
PERSISTENCE_DRIVER="postgres"
DATABASE_URL="postgresql://thalya:thalya_dev_password@localhost:5432/thalya_modas?schema=public"
CORS_ORIGINS="http://localhost:3000"
```

Em produção, `JWT_SECRET` deve ser informada explicitamente. Quando o driver for
`postgres`, `DATABASE_URL` é obrigatória.

As origens de browser aceitas em produção podem ser separadas por vírgula em
`CORS_ORIGINS`.

## Desenvolvimento

Na raiz do monorepo:

```bash
pnpm docker:postgres:up
pnpm db:deploy
pnpm dev:api
```

API: `http://localhost:3333`

Swagger: `http://localhost:3333/docs`

## Qualidade

```bash
pnpm --filter @thalya-modas/api lint
pnpm --filter @thalya-modas/api typecheck
pnpm --filter @thalya-modas/api exec vitest run
pnpm --filter @thalya-modas/api test:coverage
pnpm --filter @thalya-modas/api build
```

Para incluir os testes reais de PostgreSQL:

```bash
RUN_PRISMA_INTEGRATION_TESTS=true \
pnpm --filter @thalya-modas/api exec vitest run --fileParallelism=false
```

Os testes Prisma criam e removem apenas registros identificados para teste. O
workflow principal do repositório provisiona um PostgreSQL isolado e executa
migrations, cobertura e build.

## Persistência

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:deploy
pnpm db:studio
```

As migrations devem ser versionadas em `prisma/migrations`. Em CI e produção,
use `db:deploy`; `db:migrate` é reservado ao desenvolvimento.

## Cloudflare R2

O adapter gera URLs assinadas para upload direto de `image/webp`. Configure:

```env
R2_ENDPOINT=""
R2_ACCESS_KEY=""
R2_SECRET_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""
```

A assinatura possui teste unitário. A permissão real de escrita do token e do
bucket deve ser validada com:

```bash
pnpm --filter @thalya-modas/api r2:validate
```

Não registre valores de `.env`, tokens ou URLs assinadas em logs ou commits.
