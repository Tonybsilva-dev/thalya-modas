---
name: bug-bounty
description: Conduz um dia de bug bounty no Store Flow - varre um módulo atrás de falhas de segurança, isolamento entre empresas e filiais, permissões por papel, gates de plano e erros, registra no ClickUp e corrige por prioridade. Use quando o usuário disser "dia de bug bounty", "rodada de bug bounty" ou pedir varredura de segurança.
argument-hint: "[módulo ou 'semana']"
disable-model-invocation: true
---

# Bug bounty

Escopo: $ARGUMENTS (se vazio, as mudanças da semana: `git log --since="7 days ago" --no-merges`).

## 1. Varredura em paralelo
Dispare subagentes ao mesmo tempo, cada um com o escopo dividido:
- `security-reviewer` na API (isolamento `storeId`/`tenantId`, papéis, `plan-gate`, rotas públicas, upload, auditoria de planos).
- `security-reviewer` no backoffice (`proxy.ts`, `NEXT_PUBLIC_*`, decisão de acesso no cliente, HTML com dado do usuário).
- `contract-checker` (rotas que o backoffice chama e a API não tem, e o contrário; chaves do catálogo).
Cada um devolve achados com: arquivo:linha, cenário de ataque ou falha, severidade (crítica, alta, média, baixa).

Junto: `pnpm audit --prod`, alertas do CodeQL e do Dependabot (`gh pr list --author app/dependabot`).

## 2. Registro
Peça ao `clickup-scout` para criar as tasks na lista Bug Bounty (1000470000013355), uma por achado, com severidade no título: `[API · Crítica] ...`. Não registre duplicatas de tasks abertas.

## 3. Correção
Na branch `fix/bug-bounty-round-N`. Ordem: crítica → alta → média. Cada correção ganha teste que falharia antes (`test-writer`). Commits pequenos, um por achado: `fix(api): ...`.

## 4. Fechamento
Tabela: achado, severidade, status (corrigido, pendente, descartado com motivo), commit. Atualize as tasks. Sugira o texto do changelog com a skill `changelog` sem detalhar como explorar a falha.
