# Thalya Modas

Monorepo da plataforma operacional da Thalya Modas, gerenciado com pnpm
workspaces.

## Aplicações e pacotes

```txt
apps/
  api/         API Fastify, Prisma/PostgreSQL e autenticação
  backoffice/  Interface operacional em Next.js
  docs/        Storybook do design system
packages/
  ui/          Componentes React e tokens visuais Nitro
docker/
  postgres/    Infraestrutura local do PostgreSQL
```

## Pré-requisitos

- Node.js 22
- pnpm 10.33
- Docker Desktop para fluxos com PostgreSQL

## Desenvolvimento local

```bash
pnpm install
pnpm docker:postgres:up
pnpm db:deploy
pnpm dev:api
pnpm dev:backoffice
```

A API usa `http://localhost:3333` por padrão e o backoffice,
`http://localhost:3000`.

Copie `apps/api/.env.example` para `apps/api/.env` antes de iniciar a API.
Quando `PERSISTENCE_DRIVER=postgres`, `DATABASE_URL` é obrigatória. Em produção,
`JWT_SECRET` também deve ser configurada explicitamente.

## Qualidade

```bash
pnpm lint
pnpm typecheck
pnpm --filter @thalya-modas/api exec vitest run
pnpm build
```

Para executar também os testes de integração com PostgreSQL:

```bash
RUN_PRISMA_INTEGRATION_TESTS=true \
pnpm --filter @thalya-modas/api exec vitest run --fileParallelism=false
```

O workflow principal está em `.github/workflows/ci.yml` e executa migrations,
lint, typecheck, testes com cobertura e build.

## Estado funcional

- Autenticação por JWT e cookie httpOnly.
- Cadastro e onboarding de loja.
- Recuperação de senha e kill switches por módulo.
- Dashboard protegido conectado ao backoffice.
- Fornecedores, responsáveis, produtos, estoque, pedidos de compra e
  recebimentos com adapters in-memory e Prisma.
- Upload WebP para Cloudflare R2 preparado; a validação real do bucket ainda é
  uma pendência operacional.

Os read models gerais do dashboard ainda usam dados em memória. A persistência
transacional está concentrada no catálogo e nos fluxos de fornecedores.
