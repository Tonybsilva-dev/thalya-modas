# Store Flow

SaaS multi-tenant para gerenciamento de lojas e comércio (catálogo, estoque, compras, vendas, financeiro). Produto do Antonio (solo), em construção.
Responda em português do Brasil. Código, commits e nomes de branch em inglês (ver `.claude/rules/git-flow.md`).

## Mapa do repositório

Monorepo pnpm (Node 22, pnpm 10.33). Este repo é a raiz; `apps/backoffice` tem o próprio `CLAUDE.md`/`AGENTS.md` (regras do Next.js 16, leia antes de mexer lá).

| Pasta | O que é | Stack |
|---|---|---|
| `apps/api` | API REST | Node 22, Fastify 5, TypeScript, Zod, Prisma, PostgreSQL, Vitest, Biome |
| `apps/backoffice` | Backoffice da plataforma (SUPER_ADMIN) e telas operacionais em evolução | Next.js 16, React 19, TanStack Query, Zustand, next-intl, nuqs, Tailwind 4 |
| `packages/ui` | Design system Nitro `@store-flow/ui` | React 19, Radix, Tailwind |
| `apps/docs` | Storybook do design system | Storybook |
| `design-system/` | Decisões de interface (`MASTER.md`) | Markdown |
| `docs/` | Documentação técnica versionada (papéis/tenancy, planos, CI/CD, telas) | Markdown |

## Como o SaaS é gerenciado

Igual ao TrinketOS: a plataforma é administrada por um SUPER_ADMIN no backoffice, e cada cliente é uma empresa com suas filiais.

| Papel | Escopo | O que faz |
|---|---|---|
| SUPER_ADMIN | Plataforma | Dono do SaaS. Gerencia empresas, filiais, usuários, planos, módulos, exceções por empresa, kill switches, manutenção e auditoria (`/backoffice`). Opera uma loja só com `X-Store-Id` e respeita os kill switches. |
| ADMIN | Empresa (`Tenant`) | Dono da empresa. Administra todas as filiais e seus usuários; cadastra MANAGER, EMPLOYEE e CUSTOMER locais. Não promove a ADMIN/SUPER_ADMIN. |
| MANAGER | Filiais com `StoreMembership` ativa | Gerente: acesso operacional à(s) filial(is) em que atua, como o EMPLOYEE. Não administra usuários (isso é de ADMIN e SUPER_ADMIN). |
| EMPLOYEE | Filiais com `StoreMembership` ativa | Operação diária de catálogo, estoque, compras e vendas. |
| CUSTOMER | Própria conta | Perfil próprio; sem acesso ao backoffice interno. |

- **Isolamento:** `Tenant (empresa) → Store (filial)`. Dado operacional é por `storeId`, dado de empresa por `tenantId`; a seleção da filial é por `X-Store-Id`. Detalhes em `docs/roles-and-tenancy.md`.
- **Funcionalidades por plano:** o catálogo `feature-catalog.ts` (módulo → funcionalidade) é o equivalente do `PlanFeature` do TrinketOS. O bloqueio é sempre pela chave da funcionalidade (hook `plan-gate` + `operationalFeature`), nunca pelo nome do plano. Kill switches de plataforma e exceções por empresa prevalecem sobre o plano. Detalhes em `docs/plans-and-controls.md`.
- **Auditoria:** mudança de plano, vínculo ou controle exige `reason` e grava `PlanAudit` na mesma transação.

## Semana de trabalho (detalhes em `.claude/rules/workflow-semanal.md`)

| Dia | Etapa | Skill de entrada | Sai com |
|---|---|---|---|
| Segunda | Planejamento | `/planejar-semana` → `/escopar` por item | Specs no Obsidian + tasks no ClickUp em "Pronto para implementar" |
| Terça a quinta | Implementação e testes | `/implementar` · `/coletar-feedback` | Código + testes + OpenAPI + ClickUp e vault atualizados |
| Sexta | Bug bounty | `/bug-bounty` | Achados registrados e corrigidos por severidade |
| Sábado | Fortalecimento | `/fortalecer` → `/retro-semana` | Observabilidade, performance, docs em dia, changelog |

O hook de início de sessão diz em que etapa estamos. Fora da etapa, avise antes de começar algo de outra etapa.

## Fontes da verdade

- **Obsidian** (detalhes, fluxos, regras de negócio, specs, decisões, credenciais): `C:\Users\Antonio Silva\Desktop\Source\Source\01 - Projects\Agency\Store Flow\`. Índice: `_Store Flow.md`. Estrutura e templates: skill `registrar-no-vault`.
- **ClickUp** (o que fazer e em que estado): pasta "Store Flow" no space Freelancers. Spec resumida na task **antes** de implementar e atualizada **ao concluir**.
- **OpenAPI** (contrato da API): gerado por `pnpm openapi:generate`; toda rota com `tags`, `summary` e `description` que batem com o comportamento. `pnpm openapi:changes` mostra o que mudou.
- **`docs/` do repo** (regras técnicas versionadas junto com o código): `roles-and-tenancy`, `plans-and-controls`, `ci-cd`, notas de tela. Mudou a regra, mude a nota no mesmo PR.
- **Código** (como é feito): padrões em `.claude/rules/padroes/`.

## Definição de Pronto

- [ ] Gate verde (`pnpm lint` · `pnpm typecheck` · `pnpm --filter @store-flow/api exec vitest run`) e testes novos cobrindo a regra.
- [ ] Funcionalidade nova registrada em `feature-catalog.ts` e mapeada em `operationalFeature` (ou justificativa de ser base do produto na spec).
- [ ] OpenAPI: rotas novas ou alteradas com `summary` e `description` (papéis, plano, erros).
- [ ] ClickUp: descrição reflete o que foi entregue e há comentário com branch e commits.
- [ ] Obsidian: regra de negócio ou fluxo alterado está atualizado na nota correspondente; `docs/` do repo também, quando for regra técnica.
- [ ] Commit no padrão Conventional Commits, sem co-autoria; push só quando pedido. Resumo final diz o que validar em preview.

## Nunca

- Nunca leia, repita ou grave valores de segredos. Credenciais são documentadas por nome e local, nunca por valor. `.env` fica fora do git.
- Nunca `git push --force` na `preview-interface`. Nunca edite migration Prisma já versionada (o hook bloqueia).
- Nunca bloqueie funcionalidade pelo nome do plano. Sempre pela chave em `feature-catalog.ts`.
- Nunca use `storeId`/`tenantId` vindo do corpo da requisição: sempre do contexto autenticado (`request.storeContext`).
- O PostgreSQL local é o do container `as-trinketos-postgres-1` (porta 5433), compartilhado só como infraestrutura. Use apenas a base `store-flow`; nunca toque na base `trinketos`.
