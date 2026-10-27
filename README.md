# Store Flow

Monorepo da plataforma operacional da Store Flow, gerenciado com pnpm
workspaces.

A estrutura SaaS usa `Tenant` para a empresa e `Store` para cada filial.
Uma empresa pode administrar várias filiais, mantendo estoque e catálogo
por loja. Veja [papéis, empresas e filiais](docs/roles-and-tenancy.md).

## Aplicações e pacotes

```txt
apps/
  api/         API Fastify, Prisma/PostgreSQL e autenticação
  backoffice/  Administração da plataforma para SUPER_ADMIN em Next.js
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
`http://localhost:3001`.

O desenvolvimento local usa o PostgreSQL existente do TrinketOS, em
`localhost:5433`, com a base separada `store-flow`. O comando
`docker:postgres:up` apenas inicia o container existente
`as-trinketos-postgres-1`; não cria outro PostgreSQL. A API e o backoffice
rodam no host, sem containers próprios. A porta 3001 evita conflito com o
frontend do TrinketOS.

Copie `apps/api/.env.example` para `apps/api/.env` antes de iniciar a API.
O exemplo já seleciona PostgreSQL e a base `store-flow`. A base precisa existir
antes de executar `pnpm db:deploy`. No PowerShell, use `pnpm.cmd` se a política
de execução bloquear `pnpm.ps1`.

Os recursos compartilhados continuam sob o Compose do TrinketOS; desligar
esse Compose interrompe o banco dos dois projetos. Não existe comando padrão
para parar o banco compartilhado pelo Store Flow. O Compose em `docker/compose.yml`
fica reservado ao uso isolado explícito; veja [docker/README.md](docker/README.md).
Quando `PERSISTENCE_DRIVER=postgres`, `DATABASE_URL` é obrigatória. Em produção,
`JWT_SECRET` também deve ser configurada explicitamente.

## Qualidade

```bash
pnpm lint
pnpm typecheck
pnpm --filter @store-flow/api exec vitest run
pnpm build
```

Para executar também os testes de integração com PostgreSQL:

```bash
RUN_PRISMA_INTEGRATION_TESTS=true \
pnpm --filter @store-flow/api exec vitest run --fileParallelism=false
```

O CI separa qualidade, testes unitários, integração PostgreSQL e builds em jobs
independentes, consolidados pelo check `CI Gate`. Segurança e release da API
possuem workflows próprios. Consulte [docs/ci-cd.md](docs/ci-cd.md) para a
operação e a proteção de branches recomendada.

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

## Papeis e multi-tenancy

A hierarquia e `SUPER_ADMIN > ADMIN > EMPLOYEE > CUSTOMER`. Consulte
[roles-and-tenancy.md](docs/roles-and-tenancy.md) para as permissoes por loja,
a migracao dos papeis antigos e o comando `pnpm admin:bootstrap`.

## Porta de entrada e identidade

O fluxo de cadastro, onboarding e confirmacao do Starter, as regras de sessao no Redis compartilhado (porta 6379), os cadastros comerciais e as limitacoes operacionais estao em [docs/entry-access.md](docs/entry-access.md). Consulte tambem o [manual da marca](docs/brand-manual.md) e o [mapa de e-mails futuros](docs/email-events.md).

O estudo de referencias do varejo esta em [docs/retail-reference-study.md](docs/retail-reference-study.md). O catalogo visual do manual pode ser consultado no Storybook, em **Store Flow / Manual da marca**, com `pnpm dev:docs`.
