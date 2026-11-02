---
name: nova-migration
description: Cria a próxima migration Prisma da API do Store Flow com nome e timestamp corretos. Use sempre que precisar alterar o banco (tabela, coluna, índice, dado inicial).
argument-hint: "[descrição curta]"
allowed-tools: Bash(ls *)
---

# Nova migration

Últimas migrations: !`ls apps/api/prisma/migrations | tail -4`

1. Edite `apps/api/prisma/schema.prisma` e gere com `pnpm db:migrate --name <descricao_em_snake_case>` (cria `AAAAMMDDHHMMSS_descricao`). Peça confirmação ao usuário antes: o comando altera o banco local. Só na base `store-flow` (container compartilhado `as-trinketos-postgres-1`, porta 5433).
2. Nunca edite migration já versionada (o hook bloqueia). Se o timestamp colidir ou ficar antes da última migration aplicada, avise o usuário.
3. Antes de migration que apaga/transforma dados, faça backup local em `.local-backups/` e registre no PR.
4. Toda tabela operacional tem `storeId` com índice; tabela de empresa, `tenantId`. Dinheiro em `Decimal`. Coluna nova em tabela com dados: `NULL` ou com `DEFAULT`/backfill na própria migration.
5. Dados iniciais (plano Padrão, catálogos) idempotentes (`ON CONFLICT DO NOTHING` / `WHERE NOT EXISTS`). Migrations de dados que reagrupam registros preservam IDs, slugs e arquivos (ver `add_tenants`).
6. Atualize entidade de domínio, adapter Prisma e repositório in-memory no mesmo commit; `pnpm db:generate`.
7. Rode `pnpm --filter @store-flow/api exec prisma validate --schema prisma/schema.prisma` e a suíte com PostgreSQL (`RUN_PRISMA_INTEGRATION_TESTS=true ... --fileParallelism=false`).
8. Release usa `pnpm db:deploy` (`migrate deploy`), nunca `migrate dev`.

Descrição pedida: $ARGUMENTS
