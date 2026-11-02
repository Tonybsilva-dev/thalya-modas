---
name: ship
description: Fecha o trabalho atual com commit (e push/PR quando pedido) no Store Flow, sem co-autoria e no padrão Conventional Commits. Use quando o usuário pedir "commit", "commita", "sobe", "faça o push", "abre o PR", "realize o commit".
when_to_use: "Pedidos como: realize o commit, faça o commit e o push, pode subir, commita sem co-autoria, abre o PR, fez o push?"
argument-hint: "[push | pr]"
allowed-tools: Bash(git status *) Bash(git diff *) Bash(git log *) Bash(git add *) Bash(git commit -m *) Bash(git branch *)
---

# Ship

## Estado atual
Branch: !`git branch --show-current` · sem push: !`git log --oneline @{u}..HEAD 2>/dev/null | wc -l`
!`git status --short | head -40`

## Passos

1. Confira a branch (`.claude/rules/git-flow.md`). Se estiver em `preview-interface`, pare e pergunte (crie `feature/*`, `fix/*` ou `chore/*`).
2. Rode o gate antes de commitar, só nos pacotes tocados:
   - API: `pnpm --filter @store-flow/api qa` (format/lint, testes alterados, typecheck) e, se mexeu em regra, `pnpm --filter @store-flow/api exec vitest run`
   - Backoffice: `pnpm lint` · `pnpm typecheck` · `pnpm test:backoffice`
   - UI/Storybook: `pnpm typecheck`
   Se falhar, corrija ou mostre o erro. Não commite com o gate vermelho sem o usuário autorizar. Nunca `--no-verify`.
3. Agrupe as mudanças em commits coerentes, em Conventional Commits, inglês, imperativo, **sem `Co-Authored-By`**. Ex.: `feat(inventory): add barcode lookup to stock adjustments`. O `commitlint` valida a mensagem.
4. Não adicione ao commit: `.env*`, `.local-backups/`, `dist/`, `coverage/`, `storybook-static/`. Pare e avise se algum aparecer no `git status`.
5. Se `$ARGUMENTS` contém `push` ou o usuário pediu para subir: `git push` (com `-u origin <branch>` se nova). Nunca `--force`. Se contém `pr` ou foi pedido: `gh pr create` para `preview-interface`, descrição com resumo, o que validar em preview e link da task do ClickUp.
6. Contrato mudou entre API e backoffice? Lembre a ordem de deploy: API primeiro.
7. Documentação (Definição de Pronto): rotas alteradas com `summary`/`description` atualizados; se a tarefa veio do ClickUp, peça ao `clickup-scout` o comentário "O que foi entregue" com branch e commits; se mudou regra ou fluxo, rode `registrar-no-vault`.

## Resposta final (sempre neste formato)

| Branch | Commits | Push / PR |
|---|---|---|

Depois: o que validar em preview e se há task do ClickUp para atualizar.
