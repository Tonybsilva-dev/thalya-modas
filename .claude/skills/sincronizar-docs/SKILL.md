---
name: sincronizar-docs
description: Confere e corrige a sincronia entre código, OpenAPI, ClickUp, Obsidian e docs/ do Store Flow para um período ou uma task - rotas sem descrição, tasks concluídas sem registro do que foi entregue, regras alteradas sem nota atualizada. Use ao concluir tasks, no sábado, ou quando o usuário disser que a documentação está desatualizada.
argument-hint: "[task, branch ou 'semana']"
---

# Sincronizar documentação

Escopo: $ARGUMENTS

1. Peça ao `docs-keeper` o relatório de divergências do escopo (código × OpenAPI × ClickUp × Obsidian × `docs/`).
2. **OpenAPI:** para cada rota apontada, escreva ou corrija `summary`/`description` com papéis (do guard), plano (de `operationalFeature`) e erros (das exceções lançadas). Rode `pnpm openapi:generate` e `pnpm openapi:changes`.
3. **ClickUp:** via `clickup-scout`, atualize a descrição das tasks cujo escopo mudou e adicione o comentário "O que foi entregue" nas concluídas sem ele.
4. **Obsidian:** atualize regras e fluxos alterados com `registrar-no-vault` e marque a spec como "implementada".
5. **docs/ do repo:** corrija `roles-and-tenancy.md`, `plans-and-controls.md`, READMEs e `apps/api/todo.md` que contradizem o código.
6. Commit `docs(api): document <assunto> routes` (ou similar) com as mudanças versionadas.

Saída: tabela do que foi corrigido em cada fonte e o que ficou pendente.
