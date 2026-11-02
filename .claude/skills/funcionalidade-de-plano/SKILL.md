---
name: funcionalidade-de-plano
description: Cria ou altera uma funcionalidade ou módulo controlado por plano (feature-catalog) no Store Flow, mantendo API, plan-gate, backoffice e kill switches em sincronia. Use quando o usuário falar em liberar algo por plano, módulo, funcionalidade, kill switch ou matriz de planos.
argument-hint: "[modulo.funcionalidade] [descrição]"
---

# Funcionalidade de plano

Leia antes: `.claude/rules/padroes/planos-controles.md` e `docs/plans-and-controls.md`.

## Checklist (todos os itens, na ordem)

1. **Catálogo** `apps/api/src/core/domain/feature-catalog.ts`: nova entrada em `featureCatalog` com `key` `modulo.nome`, `label` em português para o lojista e `available` (`false` enquanto em desenvolvimento). Módulo novo: `key`, `label`, `description` e lista de funcionalidades.
2. **Gate de rota**: linha em `operationalFeature(url)` cobrindo todas as rotas da funcionalidade (o `plan-gate` aplica por `onRoute`). Sem isso, a rota fica aberta; o hook `feature-catalog-guard` avisa.
3. **Plano Padrão**: decida se vem ligada. O plano Padrão publicado é atribuído a empresas existentes e futuras; se precisar de dado inicial/backfill, crie migration (skill `nova-migration`).
4. **Kill switch de ambiente** (só se a spec pedir): `FeatureKey` em `shared/features/feature-flags.ts`, variável `FEATURE_*_ENABLED` em `shared/env/env.ts` e `.env.example`, e teste de módulo desabilitado.
5. **Backoffice**: o catálogo vem de `GET /admin/features`; confirme que aparece no módulo certo em `/backoffice/plans` e no editor de exceções da empresa (`tenant-plan-panel.tsx`). Telas operacionais tratam `SF-FEAT-403` com mensagem clara.
6. **Testes**: rota bloqueada por plano, por exceção da empresa e por kill switch; `catalogKeys` aceito em `PATCH /admin/plans`.
7. **Docs**: `docs/plans-and-controls.md` (repo), a nota de regras no Obsidian e a spec atualizados; OpenAPI das rotas cita a funcionalidade.
8. **Contrato**: subagente `contract-checker` para confirmar chaves iguais na API e no backoffice.

Saída: tabela com chave, módulo, ligada no plano Padrão, rotas protegidas e arquivos alterados.
