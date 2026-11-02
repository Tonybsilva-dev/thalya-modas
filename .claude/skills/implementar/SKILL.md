---
name: implementar
description: Implementa e testa uma funcionalidade já escopada do Store Flow (spec no Obsidian e task no ClickUp), de ponta a ponta na API e no backoffice, incluindo feature-catalog, OpenAPI, testes e atualização de ClickUp e Obsidian. Use de terça a quinta, ou quando o usuário pedir para implementar uma task ou funcionalidade.
argument-hint: "[task do ClickUp ou nome da spec]"
---

# Implementar

Item: $ARGUMENTS

## 0. Portão de entrada
Confirme que existe spec em `04 - Specs/` e task com a tag `pronto-para-implementar` e a spec resumida. Sem isso, pare e sugira `/escopar`. Troque a tag para `em-progresso` (via `clickup-scout`).

## 1. Branch
A partir de `preview-interface` atualizada (`.claude/rules/git-flow.md`). Plano de execução curto em `.claude/plans/<slug>.md` com as fases abaixo.

## 2. API (nesta ordem)
1. Domínio: entidade, value objects, schema Zod e contrato do repositório em `core/domain`.
2. Use case em `core/application/use-cases` + repositório `in-memory` + testes unitários das regras numeradas da spec (`test-writer`). Rode e mostre a saída.
3. Migration (skill `nova-migration`) e adapter Prisma em `core/infra/persistence/prisma`, ligados no `AppContainer`. Teste de integração com PostgreSQL.
4. `feature-catalog.ts` + `operationalFeature` (skill `funcionalidade-de-plano`) quando a spec define funcionalidade de plano.
5. Rota em `app/http/routes` com guards de papel, `storeContextMiddleware`, schema Zod e OpenAPI (`tags`, `summary`, `description` com o texto da spec). Teste de integração da rota.

## 3. Backoffice
`*-api.ts` da feature com `apiRequest`, tipos em `domain`, telas em `presentation` com componentes do DS (`padroes/telas.md`), textos em `messages/`, estado na URL com `nuqs`. Confira os cliques contra a spec. Componente novo reutilizável vai para `packages/ui` com história no Storybook.

## 4. Verificação
- `contract-checker` (API × backoffice) e, se mexeu em acesso, plano ou rota pública, `security-reviewer`.
- Gates verdes: `pnpm lint`, `pnpm typecheck`, `pnpm --filter @store-flow/api exec vitest run`, `pnpm build`.
- `pnpm openapi:generate` e `pnpm openapi:changes` quando mexeu em rotas.
- Se houver navegador, rode o fluxo principal em 375 e 1440 px e tire print; se não, diga que a verificação visual não foi feita.
- Releia os critérios de aceite da spec um a um e marque.

## 5. Fechar (Definição de Pronto)
- Skill `ship`.
- Spec: status "implementada" e histórico com o que mudou em relação ao planejado.
- ClickUp: descrição atualizada se o escopo mudou, comentário "O que foi entregue" com branch, commits e o que validar em preview, tag `em-revisao`.
- Obsidian: regras de negócio e fluxos alterados (`registrar-no-vault`); `docs/` do repo se a regra técnica mudou (papéis, planos, pipeline); `apps/api/todo.md` marcado.
- Mudou o escopo no meio do caminho? Atualize spec e task **antes** de continuar codando.
