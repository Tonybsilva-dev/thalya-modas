---
name: escopar
description: Escreve a spec de uma funcionalidade ou mudança do Store Flow antes de qualquer código - como o mercado resolve, fluxo com menos cliques por papel, contrato da API, decisão de plano e módulo para o SUPER_ADMIN, testes, observabilidade - e registra no Obsidian e no ClickUp. Use no planejamento ou quando o usuário pedir para escopar, especificar ou planejar uma funcionalidade.
argument-hint: "[funcionalidade ou link da task]"
---

# Escopar

Item: $ARGUMENTS

## 1. Entender
Leia a task (via `clickup-scout`), o feedback que originou o pedido e as regras relacionadas no Obsidian e em `docs/` (`roles-and-tenancy.md`, `plans-and-controls.md`). Entreviste o usuário com no máximo 5 perguntas, só sobre o que não dá para descobrir sozinho.

## 2. Mercado
Peça ao `market-researcher`: como Bling, Tiny, Omie, Linx e os POS internacionais resolvem isso, e o que lojistas pequenos reclamam. Traga 2 ou 3 padrões e quando cada um faz sentido para o Store Flow.

## 3. Experiência
Desenhe o fluxo por papel (SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE, CUSTOMER quando houver). Peça ao `ux-flow-reviewer` para contar os cliques e apontar onde cortar. Meta: ação principal em 1 clique, tarefa frequente em até 3. Use `padroes/telas.md` e o MASTER do design system.

## 4. Decisões obrigatórias
- **Multi-tenant:** o dado é de empresa (`tenantId`) ou de filial (`storeId`)? Quem enxerga e quem altera, por papel.
- **Plano:** toda funcionalidade operacional nova entra no catálogo `feature-catalog.ts`, para o SUPER_ADMIN incluir ou não em cada plano e aplicar exceções por empresa. Defina módulo, chave (`modulo.nome`), rótulo e descrição para o lojista, e se vem ligada no plano Padrão. Só fica fora do catálogo o que é base do produto, com justificativa escrita. Isso vale como decisão de `PlanFeature` do TrinketOS.
- **Contrato:** rotas (método, caminho, papéis, funcionalidade), schemas Zod, erros `SF-*`, migration Prisma, eventos de auditoria.
- **OpenAPI:** o texto do `summary` e da `description` de cada rota já sai daqui.
- **Testes:** casos que provam que funciona (ver `padroes/testes.md`), incluindo outra loja/empresa, papel sem permissão e bloqueio por plano ou kill switch.
- **Observabilidade:** o que logar, que métrica ou evento mostra que está sendo usado e funcionando.
- **Dados existentes:** a migration preserva IDs e dados atuais? Precisa de backup em `.local-backups/`?
- **Fora do escopo:** o que não será feito agora.

## 5. Registrar (portão da segunda)
- Spec completa: Obsidian `04 - Specs/<AAAA-Www> - <nome>.md`, com `spec-template.md` desta pasta.
- Task no ClickUp (via `clickup-scout`, lista da área): descrição com `task-template.md` desta pasta (versão resumida), link da spec, tag `pronto-para-implementar`.
- Sem os dois registros, não comece a implementar.
