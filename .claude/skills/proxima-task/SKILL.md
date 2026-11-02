---
name: proxima-task
description: Escolhe a próxima tarefa de maior ganho no backlog do Store Flow (ClickUp + decisões do Obsidian) e prepara o início. Use quando o usuário perguntar "qual a próxima task", "o que fazemos agora", "próximo passo".
argument-hint: "[rápida | grande | bug]"
---

# Próxima task

Listas do ClickUp (pasta Store Flow, workspace 90132843461):
- Backlog geral: 1000470000013351
- API: 1000470000013352
- Backoffice: 1000470000013353
- Infra: 1000470000013354
- Bug Bounty: 1000470000013355

1. Delegue ao subagente `clickup-scout`: tasks abertas dessas listas, com estágio, prioridade, tags e data de atualização. Considere também `apps/api/todo.md`.
2. Leia a seção "Decisões" da nota `_Store Flow.md` do vault para não sugerir algo que contradiga uma decisão.
3. Ranqueie por: bloqueia cliente > segurança/isolamento de tenant > pedido de cliente > receita (planos, controles) > dívida técnica e melhoria interna. Filtro pedido: $ARGUMENTS.
4. Mostre as 3 melhores com: por que agora, tamanho estimado (P/M/G), apps envolvidos (api, backoffice, ui).
5. Quando o usuário escolher, troque a tag para `em-progresso` e inicie com a skill adequada (`escopar` e `implementar`, `diagnosticar-producao`, `padronizar-tela`).
