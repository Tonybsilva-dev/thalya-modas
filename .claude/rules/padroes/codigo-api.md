---
paths:
  - "apps/api/src/**/*.ts"
  - "apps/api/prisma/**"
  - "apps/api/scripts/**"
---

# Código da API (apps/api)

## Camadas
`app/http` (servidor, rotas, middlewares, erros) → `core/application/use-cases` (regra de negócio) → `core/domain` (entidades, value objects, schemas Zod, contratos de repositório) → `core/infra` (Prisma, in-memory, auth, storage). `shared` para env, paginação, RBAC e utilitários.

## Convenções
- Rota não tem regra de negócio: valida com Zod, chama o use case e devolve DTO. Nunca devolva entidade do Prisma.
- Dependências entram pelo `AppContainer` (`app/http/container.ts`). Use case recebe contratos de `domain/repositories`, nunca `PrismaClient`.
- **Ordem de construção:** use case + repositório `in-memory` + testes primeiro; só depois o adapter Prisma, rodando os mesmos testes de contrato nos dois.
- Dado operacional recebe `storeId` de `request.storeContext`. Dado de empresa recebe `tenantId` do mesmo contexto (ver `seguranca.md`).
- Dinheiro é `Decimal` no banco e centavos/string no contrato, nunca `number` de ponto flutuante.
- Erro de domínio é subclasse de `AppError` (`DomainError`, `NotFoundError`, `ForbiddenError`, `ValidationError`, `FeatureDisabledError`...), mensagem em português para o usuário final, catalogada em `error-catalog.ts`. Nunca `throw new Error` genérico em fluxo de negócio.
- Todas as respostas de erro carregam `traceId` (header `X-Trace-Id`).
- Funcionalidade de plano: chave em `core/domain/feature-catalog.ts` + mapeamento em `operationalFeature(url)` (o hook `plan-gate` aplica). Kill switch de ambiente: `FeatureKey` em `shared/features`.
- Ação administrativa que muda plano, vínculo ou controle: grava a mudança e a auditoria na mesma transação (`administrative-operation.ts`).
- Listagens usam `shared/pagination` (`paginationQuery`, `pageSchema`).
- Variável de ambiente nova entra em `shared/env/env.ts` (validada com Zod) e em `.env.example` (sem valor real).
- Formato: Biome (tabs, aspas simples). `// biome-ignore` só com motivo escrito.

## Banco
- Migration com a skill `nova-migration`. Toda tabela operacional tem `storeId` com índice; de empresa, `tenantId`.
- Prisma Client é gerado (`pnpm db:generate`); nunca edite `node_modules/.prisma`.

## Comandos
`pnpm dev:api` · `pnpm --filter @store-flow/api exec vitest run [arquivo]` · `pnpm lint` · `pnpm typecheck` · `pnpm --filter @store-flow/api qa`. No PowerShell use `pnpm.cmd` se a política bloquear `pnpm.ps1`.
