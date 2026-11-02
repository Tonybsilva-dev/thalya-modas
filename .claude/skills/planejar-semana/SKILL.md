---
name: planejar-semana
description: Abre a segunda-feira de planejamento do Store Flow - reúne feedback, backlog, pendências e a retro anterior, escolhe de 3 a 5 itens da semana e dispara o escopo de cada um. Use na segunda ou quando o usuário pedir para planejar a semana.
argument-hint: "[foco opcional, ex.: 'estoque' ou 'planos']"
disable-model-invocation: true
---

# Planejar a semana

Semana: !`date +%G-W%V` · Foco pedido: $ARGUMENTS

## 1. Juntar as entradas (em paralelo, via subagentes)
- `clickup-scout`: tasks abertas das listas API, Backoffice, Infra e Backlog, com prioridade e estágio; tasks paradas há mais de 14 dias.
- Obsidian: `06 - Feedback/_Inbox.md` (itens sem triagem) e a retro mais recente em `05 - Semanas/`.
- Repositório: `apps/api/todo.md` e as pendências declaradas em `README.md` e `docs/*.md` (validação do bucket R2, read models do dashboard ainda em memória, verificação visual pendente).
- Alertas: `gh pr list --author app/dependabot`, último `security.yml` e `gh run list --limit 5`.
- Decisões em `_Store Flow.md` para não contrariar nada já decidido.

## 2. Escolher
Monte uma tabela de candidatos com: origem (feedback, bug, backlog, estratégia, dívida), quem pediu, impacto, tamanho (P/M/G), risco.
Regra: só entra funcionalidade nova com pedido de 2 ou mais clientes, decisão estratégica registrada, ou segurança. Capacidade da semana: até 3 itens M ou 1 G + 2 P (terça a quinta).
Apresente a proposta e espere o usuário aprovar ou trocar.

## 3. Escopar
Para cada item aprovado, rode `/escopar <item>`. Itens pequenos (correção simples) podem ir só com a task do ClickUp atualizada.

## 4. Fechar
- Nota da semana em `05 - Semanas/<AAAA-Www>.md` (template em `registrar-no-vault`): itens, ordem de implementação, riscos, o que fica para depois.
- Tasks escolhidas com a tag `pronto-para-implementar` no ClickUp, com link da spec.
- Itens do inbox de feedback triados (viraram task, foram para o backlog ou descartados com motivo).
