---
paths:
  - "apps/backoffice/**/*.{ts,tsx}"
  - "apps/backoffice/messages/**"
---

# Código do backoffice (apps/backoffice)

Antes de escrever código Next.js, leia o guia correspondente em `apps/backoffice/node_modules/next/dist/docs/` (Next 16 tem mudanças incompatíveis; ver `apps/backoffice/AGENTS.md`).

## Onde cada coisa vive
- `app/`: só rotas e layouts (`backoffice`, `login`, `unauthorized`, `(overview)`), sem regra de negócio.
- `src/features/<área>/{application,domain,presentation}`: `application` fala com a API (`*-api.ts`), `domain` tem tipos e regras puras, `presentation` tem telas e componentes. Áreas: `auth`, `backoffice` (plataforma, SUPER_ADMIN), `dashboard/<módulo>` (operacional: suppliers, inventory, orders...).
- `src/shared/`: o que mais de uma feature usa (`api`, `auth`, `config`, `i18n`, `state`, `store`, `theme`, `ui`).
- `proxy.ts`: valida a sessão com `/auth/me` e decide o destino por papel.

## Convenções
- Chamada HTTP só via `apiRequest` (`shared/api/http-client.ts`), que envia `X-Store-Id` e normaliza o erro em `ApiRequestError`. Mostre `userMessage` e mantenha o `traceId` visível para suporte.
- Estado de servidor no TanStack Query, estado de interface no Zustand (`shared/state`), filtros/abas/paginação na URL com `nuqs`. Nada de dado do servidor copiado para store.
- Textos em `messages/` com `next-intl` (pt-BR primeiro). Sem texto solto em componente novo.
- Formulários com Zod, validação antes do envio e erro em português perto do campo. Máscaras com `imask` (`masked-input.tsx`).
- Componentes de UI vêm de `@store-flow/ui` (ver `padroes/telas.md`). Componente reutilizável novo nasce no `packages/ui` com história no Storybook.
- Controle de acesso é feito no servidor/`proxy.ts` e na API; esconder botão no cliente é só experiência.
- Arquivos em `kebab-case`, componentes `PascalCase`, hooks `useAlgo`. Valores `as const` e tipos derivados em vez de `enum`.

## Gate
`pnpm lint` (eslint) · `pnpm typecheck` · `pnpm build:backoffice` · `pnpm test:backoffice` (proxy e api-error).
