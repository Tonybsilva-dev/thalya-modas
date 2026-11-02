---
name: retro-semana
description: Fecha a semana do Store Flow com uma retrospectiva curta - o que foi entregue contra o planejado, o que atrasou, o que o Claude errou ou repetiu - e atualiza skills, regras e CLAUDE.md com o que aprendeu. Use no fim do sábado ou quando o usuário pedir retro.
disable-model-invocation: true
---

# Retro da semana

1. **Planejado × entregue:** compare a nota `05 - Semanas/<AAAA-Www>.md` com as tasks concluídas e os commits da semana (`git log --since="7 days ago" --no-merges --format="%h %s"`).
2. **Atrasos e motivos:** escopo mudou? faltou informação na spec? bug inesperado? migration ou CI atrapalharam?
3. **Atrito com o Claude:** procure nos handoffs da semana (`.claude/handoff/`) e pergunte ao usuário: o que precisou ser pedido duas vezes? que regra foi ignorada? que skill não disparou? algum hook bloqueou por engano?
4. **Melhorias no setup:** para cada atrito, proponha a mudança mínima (linha no CLAUDE.md, regra, passo de skill, hook) e aplique as aprovadas. Regra que o Claude já segue sem estar escrita pode ser removida.
5. **Registre** a retro no fim da nota da semana: entregue, não entregue, aprendizados, mudanças no setup.

Resposta em até 20 linhas.
