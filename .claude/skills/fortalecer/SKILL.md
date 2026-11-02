---
name: fortalecer
description: Sábado de fortalecimento do Store Flow - revisa observabilidade, performance, dependências, cobertura de testes, padrões de código e a sincronia de documentação (OpenAPI, ClickUp, Obsidian), e aplica as melhorias de maior retorno. Use no sábado ou quando o usuário pedir para fortalecer, endurecer ou melhorar a qualidade da aplicação.
argument-hint: "[área opcional]"
disable-model-invocation: true
---

# Fortalecer

Foco: $ARGUMENTS (se vazio, tudo que mudou na semana: `git log --since="7 days ago" --no-merges`)

## 1. Diagnóstico em paralelo (subagentes)
- `observability-reviewer`: logs, erros, métricas e saúde das mudanças da semana (`padroes/observabilidade.md`).
- `docs-keeper`: rotas da semana × OpenAPI × task do ClickUp × nota do Obsidian × `docs/`.
- `test-writer` em modo lista: regras sem teste; `pnpm --filter @store-flow/api test:coverage` e compare com os limites (80/80/75/80).
- Padrões: `ui-reviewer` nas telas tocadas; Grep por `<select`, `type="date"`, textos soltos fora de `messages/`, `throw new Error(` em use cases, rotas sem `schema`.
- Dependências: `pnpm outdated -r` e `pnpm audit --prod`; PRs do Dependabot pendentes.
- Dívida declarada: itens de `apps/api/todo.md` e "pendências" dos READMEs e `docs/` (read models em memória, validação do R2, verificação visual).
- CI: `gh run list --limit 10` — jobs lentos ou instáveis.

## 2. Priorizar
Tabela única: achado, área, impacto, esforço (P/M/G). Escolha com o usuário o que entra hoje (meta: só P e M).

## 3. Aplicar
Branch `chore/fortalecer-<AAAA-Www>`. Um commit por melhoria, testes quando couber. O que ficar para depois vira task no ClickUp com tag `fortalecimento`.

## 4. Fechar o dia
`/changelog` e `/retro-semana`.
