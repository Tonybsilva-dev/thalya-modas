---
name: bom-dia-store-flow
description: Painel do início do dia no Store Flow - etapa da semana, estado do repositório, o que falta subir, último handoff, tasks em andamento, CI e foco sugerido para a etapa. Use quando o usuário abrir o dia ("bom dia", "por onde começo hoje", "status do projeto").
---

# Bom dia, Store Flow

Hoje: !`date +"%A, %d/%m"` · Semana !`date +%G-W%V`

## Repositório
Branch: !`git branch --show-current` · sem push: !`git log --oneline @{u}..HEAD 2>/dev/null | wc -l` · alterados: !`git status --short | wc -l`
Último handoff: !`ls -t .claude/handoff 2>/dev/null | head -1`

## Passos
1. Identifique a etapa pelo dia (`.claude/rules/workflow-semanal.md`) e diga qual é.
2. Commits sem push ou arquivos alterados: liste e pergunte se sobe com `ship`.
3. Último handoff: resuma em 3 linhas.
4. `clickup-scout`: tasks em progresso e em revisão, mais urgentes e altas.
5. CI: `gh run list --limit 5` e PRs abertos; destaque `CI Gate` vermelho e PRs do Dependabot.
6. Proponha o foco do dia conforme a etapa:
   - Segunda: `/planejar-semana`.
   - Terça a quinta: próximo item da nota da semana com `/implementar`; lembre de `/coletar-feedback`.
   - Sexta: `/bug-bounty semana`.
   - Sábado: `/fortalecer`, depois `/changelog` e `/retro-semana`.
   - Domingo: só emergência.

Responda em até 15 linhas.
