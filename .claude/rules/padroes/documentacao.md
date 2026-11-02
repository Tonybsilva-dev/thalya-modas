---
paths:
  - "apps/api/src/app/http/routes/**"
  - "apps/api/src/app/http/config/swagger*"
  - "apps/api/scripts/*openapi*"
  - "docs/**"
---

# Documentação (OpenAPI, ClickUp, Obsidian e docs/)

## OpenAPI
Toda rota nova ou alterada sai com `schema` completo:

```ts
schema: {
  tags: ['suppliers'],
  summary: 'Lista fornecedores da filial',
  description: `Retorna fornecedores da filial ativa, com busca e paginação.
Papéis: ADMIN, MANAGER, EMPLOYEE (SUPER_ADMIN com X-Store-Id).
Plano: purchasing.suppliers (403 SF-FEAT-403 sem ela).
Erros: 403 sem vínculo com a filial; 404 quando o fornecedor não é da filial.`,
  security: [{ sessionCookie: [] }, { bearerAuth: [] }],
  querystring, response,
}
```

- `summary` em português, imperativo curto. `description` sempre preenchida.
- Papéis copiados do guard/middleware da rota. Plano copiado de `operationalFeature(url)`.
- Schemas Zod com `.describe()` nos campos não óbvios e exemplos quando ajudarem.
- Mudou comportamento, papel, plano ou erro? Atualize a `description` no mesmo commit.
- Depois de mexer em rotas: `pnpm openapi:generate` e `pnpm openapi:changes`; o relatório fica em `apps/api/src/docs/route-changes-report.md`.
- O hook `api-docs-guard` avisa quando uma rota nova ou alterada sai sem `summary`/`description`/`tags`.

## ClickUp e Obsidian
- **Antes de implementar:** a task tem a spec resumida (template em `.claude/skills/escopar/task-template.md`) e link para a spec no Obsidian.
- **Mudou o escopo:** atualize primeiro a spec e a task, depois o código.
- **Ao concluir:** comentário na task com "O que foi entregue", branch e commits. A descrição passa a refletir o entregue.
- **Regra de negócio ou fluxo alterado:** nota correspondente do Obsidian atualizada no mesmo dia (skill `registrar-no-vault`).

## `docs/` do repositório
Regras técnicas que andam junto com o código (`roles-and-tenancy.md`, `plans-and-controls.md`, `ci-cd.md`, notas de tela). Nome em inglês `kebab-case.md`, conteúdo em português. Mudou papel, plano, controle, pipeline ou tela? Atualize a nota no mesmo PR. `README.md` raiz e `apps/api/README.md` refletem o estado funcional. Nunca documente valores de credenciais.
