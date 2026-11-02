---
paths:
  - "apps/api/src/**/*.ts"
  - "apps/backoffice/**/*.{ts,tsx}"
---

# Fluxos padrão

Use estes caminhos. Fluxo novo que não cabe aqui vira decisão registrada em `09 - Decisões/` no Obsidian.

**Requisição autenticada:** componente → `*-api.ts` da feature → `apiRequest` (`shared/api/http-client.ts`, envia cookie e `X-Store-Id`) → rota Fastify → `authMiddleware` → `storeContextMiddleware` → `plan-gate` (rotas operacionais) → use case → repositório. O `traceId` volta no cabeçalho e no corpo do erro.

**Sessão e acesso:** login pelo cookie httpOnly (ou bearer). O `proxy.ts` do backoffice e o servidor validam `/auth/me`; SUPER_ADMIN vai a `/backoffice`; ADMIN, MANAGER, EMPLOYEE e CUSTOMER vão ao próprio `/<papel>/dashboard` (`role-destination.ts`); papel desconhecido vai a `/unauthorized`. Só as telas do ADMIN usam dados reais hoje (`docs/admin-real-endpoints.md`). Papel e status são relidos do banco a cada request.

**Contexto de loja:** uma filial acessível → implícita; várias → `X-Store-Id` obrigatório. Loja desatualizada no cookie (`last-store`) é descartada e a requisição refeita sem o header (ver `http-client.ts`).

**Funcionalidade de plano:** `featureCatalog` → `operationalFeature(url)` → `plan-gate` → 403 com `details.feature` e `reason` → backoffice mostra indisponível. Kill switch de plataforma e manutenção bloqueiam rotas operacionais mapeadas, mas não login, recuperação de senha, saúde nem administração.

**Erro:** use case lança erro de domínio → `error-handler` monta o contrato público com `traceId` → backoffice exibe `userMessage` e mantém o `traceId`.

**Estoque e compras:** pedido de compra → recebimento → movimento de estoque (`InventoryMovement`), sempre dentro de transação, com `storeId`. Ajuste manual usa `inventory.adjustments`. Produto pode ter SKU e código de barras (leitor `@zxing` no backoffice).

**Imagens:** WebP convertido no navegador (`image-to-webp.ts`), enviado à API e guardado no R2 com chave por `storeId`.

**Auditoria:** mudança de plano, vínculo ou controle grava `PlanAudit` na mesma transação, com `reason` e responsável.
