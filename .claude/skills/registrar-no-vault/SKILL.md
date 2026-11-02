---
name: registrar-no-vault
description: Cria ou atualiza notas do Store Flow no Obsidian (regra de negócio, fluxo, decisão, spec, feedback, semana, ambiente, inventário de credenciais) seguindo a estrutura e os templates do vault, sem nunca gravar valor de segredo. Use quando uma regra, fluxo, decisão ou detalhe de funcionamento mudar ou precisar ser documentado.
argument-hint: "[tipo] [assunto]"
---

# Registrar no vault

Vault: `C:\Users\Antonio Silva\Desktop\Source\Source\01 - Projects\Agency\Store Flow\`
Estrutura e templates: `estrutura.md` e `templates/` nesta pasta.

1. Descubra onde o assunto já está (Grep no vault e em `docs/` do repo). Atualize a nota existente em vez de criar outra.
2. Use o template do tipo (`templates/<tipo>.md`). Preencha o frontmatter (`tipo`, `status`, `atualizado`, `clickup`, `apps`).
3. Toda nota nova ganha link na nota-índice da pasta (`_Overview.md`) e, se for decisão, na seção "Decisões" de `_Store Flow.md` com data.
4. Fluxos em Mermaid (`flowchart` ou `sequenceDiagram`) dentro da nota.
5. Imagens e anexos em `Assets/` com nome `AAAA-MM-DD-assunto.png`.
6. Regra técnica que mora no repo (`docs/roles-and-tenancy.md`, `docs/plans-and-controls.md`, `docs/ci-cd.md`): atualize o arquivo do repo e deixe no vault só o resumo de negócio com link para o caminho. Não duplique o texto completo.
7. **Credenciais:** registre só no inventário (`08 - Credenciais/_Inventario.md`): nome da variável, serviço, ambiente, onde o valor está guardado, dono, data da última rotação. Nunca o valor. Se o usuário pedir para gravar um valor, explique o motivo e ofereça o inventário.
8. Responda com os arquivos criados ou alterados e os links adicionados.
