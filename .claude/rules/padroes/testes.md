---
paths:
  - "apps/api/**/*.ts"
  - "apps/backoffice/**/*.{ts,tsx}"
  - "packages/ui/**/*.{ts,tsx}"
---

# Testes

## O que cada mudança exige
| Mudança | Teste mínimo |
|---|---|
| Regra em use case | Unitário com repositório in-memory: caminho feliz, papel sem permissão, outra loja/empresa, entrada inválida |
| Bug corrigido | Teste que falhava antes da correção, com o nome do bug na descrição |
| Rota nova | Integração (`tests/integration`) cobrindo status, schema, papel e gate de plano/kill switch |
| Funcionalidade de plano | Teste de rota bloqueada por plano e por kill switch + entrada em `operationalFeature` |
| Adapter Prisma / migration | Integração com PostgreSQL real (`RUN_PRISMA_INTEGRATION_TESTS=true`, `--fileParallelism=false`) |
| Lógica pura no backoffice | Teste em `apps/backoffice/tests` (hoje: `proxy`, `api-error`) |
| Componente do DS | História de estados no Storybook (`apps/docs`) |

## API
- Vitest. Estrutura espelha `src`: `tests/unit/<mesmo caminho>` e `tests/integration/<área>`. Helpers em `tests/integration/helpers` (`test-server`, `active-store`) e fábricas em `tests/factories`.
- Cobertura mínima do pacote: linhas 80, funções 80, branches 75, statements 80. Não rebaixe o limite para passar.
- Nome: frase em português descrevendo o comportamento. Código de caso do plano de QA em `apps/api/src/docs/tests-qa.md` quando existir.
- Datas e fuso explícitos (`America/Sao_Paulo`); nada de dependência de relógio real.
- O CI roda unitários em job separado dos de integração com PostgreSQL.

## Como rodar
- API unitário: `pnpm --filter @store-flow/api exec vitest run tests/unit`
- API completo: `pnpm --filter @store-flow/api exec vitest run`
- Só o que mudou: `pnpm --filter @store-flow/api test:changed`
- Backoffice: `pnpm test:backoffice`

Antes de dizer que terminou, mostre a saída do teste como evidência.
