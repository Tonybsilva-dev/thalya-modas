# Workflow semanal

Cada etapa tem entrada, saída e um portão. Não avance de etapa com o portão aberto: avise o usuário.

## Segunda · Planejamento
**Entradas:** inbox de feedback (Obsidian `06 - Feedback/_Inbox.md`), backlog do ClickUp, pendências de `apps/api/todo.md`, PRs do Dependabot e alertas do CodeQL, retro da semana anterior.
**Faz:**
1. `/planejar-semana`: escolhe de 3 a 5 itens da semana (critério em `proxima-task`).
2. Para cada item, `/escopar`: pesquisa de mercado (`market-researcher`), fluxo com menos cliques (`ux-flow-reviewer`), contrato, decisão de plano, testes, observabilidade.
**Saídas:** spec em `04 - Specs/` no Obsidian, task no ClickUp com a spec resumida e status "Pronto para implementar", nota da semana em `05 - Semanas/`.
**Portão:** nenhum código antes de a spec estar no ClickUp.

## Terça a quinta · Implementação e testes
**Faz:** `/implementar <task>` para cada item, na ordem da nota da semana. Durante o dia, `/coletar-feedback` sempre que chegar retorno de cliente.
Ordem por funcionalidade: domínio + use case + repositório in-memory + testes → Prisma + migration + teste de integração → rotas + OpenAPI → backoffice.
**Saídas:** código com testes, OpenAPI, `feature-catalog`, ClickUp e Obsidian atualizados; PR para `preview-interface` com `CI Gate` verde.
**Portão:** Definição de Pronto do CLAUDE.md completa em cada item. Mudou o escopo no meio? Atualize a spec e a task antes de seguir.

## Sexta · Bug bounty
**Faz:** `/bug-bounty semana`, mais `pnpm audit --prod` e alertas de CodeQL e Dependabot.
**Saídas:** achados no ClickUp (lista Bug Bounty) com severidade e correções em `fix/bug-bounty-round-N`.
**Portão:** críticas e altas corrigidas ou com plano registrado.

## Sábado · Fortalecimento
**Faz:** `/fortalecer`: observabilidade, performance, dependências, testes que faltam, cobertura (meta 80/80/75), padrões e auditoria de docs (`docs-keeper`). No fim, `/changelog` e `/retro-semana`.
**Saídas:** melhorias commitadas, `docs/changelog.md` atualizado, retro com o que mudar nas skills e regras.
**Portão:** docs sem divergência crítica (OpenAPI, ClickUp e Obsidian batem com o código).

## Domingo
Folga. Se o usuário abrir uma sessão, só emergência de produção (`/diagnosticar-producao`).
