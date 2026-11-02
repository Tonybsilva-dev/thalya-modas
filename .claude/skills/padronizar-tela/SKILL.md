---
name: padronizar-tela
description: Deixa uma tela do backoffice do Store Flow no padrão do design system Nitro e das demais telas (componentes do DS, selects e datas, diálogos, abas na URL, estados, acessibilidade e responsividade). Use quando o usuário disser que uma página "não está padronizada", "está diferente das outras", ou pedir para padronizar.
argument-hint: "[rota ou arquivo da tela]"
---

# Padronizar tela

Alvo: $ARGUMENTS

1. Leia `.claude/rules/padroes/telas.md`, `design-system/store-flow-backoffice/MASTER.md` e a tela de referência mais parecida (`features/dashboard/suppliers` para listas e CRUD; `features/backoffice/presentation` para plataforma).
2. Peça ao subagente `ui-reviewer` a lista de diferenças entre o alvo e a referência.
3. Corrija item por item. Prefira componentes de `@store-flow/ui` a criar novos; veja o Storybook (`pnpm dev:docs`/`pnpm storybook`).
4. Se a mesma correção aparece em mais de uma tela, proponha extrair um componente em `packages/ui` com história, em vez de copiar.
5. Confira em 375, 768, 1024 e 1440 px. Se tiver navegador, tire um print de cada; se não, diga que a verificação visual não foi feita.
6. `pnpm lint` · `pnpm typecheck` · `pnpm build:backoffice`. Atualize `design-system/store-flow-backoffice/MASTER.md` se a decisão de interface for nova.

Saída: lista "antes → depois" por item e as telas que ainda têm o mesmo problema.
