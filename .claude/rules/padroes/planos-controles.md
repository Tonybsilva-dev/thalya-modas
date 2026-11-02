---
paths:
  - "apps/api/src/core/domain/feature-catalog.ts"
  - "apps/api/src/shared/features/**"
  - "apps/api/src/app/http/middlewares/plan-gate.ts"
  - "apps/api/src/app/http/routes/plan.routes.ts"
  - "apps/backoffice/src/features/backoffice/**"
---

# Planos, módulos e kill switches

Referência completa: `docs/plans-and-controls.md`.

- Fonte única do catálogo: `featureCatalog` em `core/domain/feature-catalog.ts`. Hierarquia: módulo (`catalog`, `inventory`, `purchasing`, `sales`, `finance`, `analytics`) → funcionalidade (`modulo.nome`).
- Resolução: kill switch da plataforma > exceção da empresa > plano. Módulo **e** funcionalidade precisam estar habilitados. `available: false` significa "em desenvolvimento": aparece no catálogo mas não concede acesso. Plano em rascunho/arquivado não é atribuível.
- Planos e exceções pertencem ao `Tenant` e valem para todas as filiais; isolamento por `storeId` e permissão de papel continuam valendo.
- Rota operacional é protegida pelo hook `plan-gate`, que usa `operationalFeature(url)`. **Rota nova de módulo operacional precisa de uma linha lá**, senão fica sem gate (o hook `feature-catalog-guard` avisa).
- Kill switch de ambiente (`FEATURE_*_ENABLED`) é bloqueio adicional, tipado por `FeatureKey` em `shared/features`.
- Alteração de plano/vínculo/controle: `reason` obrigatório (≥ 5 caracteres) e auditoria na mesma transação. Sem cache de permissão.
- Preço do plano é cadastral: não há cobrança, assinatura ou limite de uso.
- O que é base do produto (login, onboarding, recuperação de senha, administração de plataforma) não vira funcionalidade de plano.
- Para criar ou alterar uma funcionalidade, use a skill `funcionalidade-de-plano`.
