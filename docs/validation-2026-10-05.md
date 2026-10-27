# Validação — 05/10/2026

Executada sobre o workspace atual, sem resetar alterações anteriores.

| Verificação | Resultado |
| --- | --- |
| API: suíte completa com `RUN_PRISMA_INTEGRATION_TESTS=true` | 51 arquivos, 469 testes aprovados; nenhuma falha ou teste ignorado |
| Backoffice: testes de proxy e mensagens de erro | 28 testes aprovados |
| API: `tsc --noEmit` e `tsc -p tsconfig.json` | Aprovados |
| Backoffice: build Next.js com TypeScript | Aprovado |
| Backoffice: ESLint completo | Aprovado sem diagnósticos |
| API: Biome lint completo | Sem erros; 38 avisos, principalmente assertions não nulas nas rotas administrativas |
| API: scripts `typecheck`/`build` com pré-geração Prisma | Pré-etapa bloqueada por `EPERM` ao substituir a DLL do engine no Windows. Compilação validada diretamente com o client já gerado |

## Correções necessárias

Dois testes antigos esperavam que a API revelasse `UserRepository não está configurado`. Foram atualizados para verificar mensagem pública segura, código interno estável, trace ID e ausência de diagnósticos técnicos.

Um teste antigo tratava MANAGER como role inválida. Agora rejeita uma role desconhecida. Foram acrescentados cinco casos positivos para as roles suportadas: SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE e CUSTOMER.

Depois dessas correções, a suíte completa foi executada novamente e passou.

## Escopo e limites

Os testes incluem autenticação, segmentação por role, isolamento empresarial e por filial, persistência PostgreSQL, auditoria, regras de planos, indisponibilidade de recursos e kill switches. Logs de rejeição de mudanças em `tenant_id`, slug e bucket são resultados esperados dos testes de integridade do banco.

Não há suíte de navegação visual/E2E configurada no projeto. Os 28 testes do backoffice verificam proxy e contrato de erros, não interação com dropdowns, calendário ou layout renderizado. A revisão visual no navegador permanece pendente.

Para reproduzir: no diretório `apps/api`, definir `RUN_PRISMA_INTEGRATION_TESTS=true` e executar `pnpm exec vitest run`; na raiz, executar `pnpm run test:backoffice`. Lint e compilação usam os comandos indicados na tabela. Os testes PostgreSQL utilizam o banco configurado e criam/removem seus próprios fixtures.
