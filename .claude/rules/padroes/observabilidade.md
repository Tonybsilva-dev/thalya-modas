---
paths:
  - "apps/api/src/**/*.ts"
  - "apps/backoffice/src/shared/api/**"
  - "apps/backoffice/app/error.tsx"
---

# Observabilidade

## Logs e rastreio (API)
- Fastify com Pino (`pino-pretty` só em desenvolvimento). Todo request tem `traceId` (`X-Trace-Id`, gerado pelo `traceIdMiddleware` quando ausente). Código novo propaga o `traceId` e não o sobrescreve.
- `info` para eventos de negócio (pedido de compra criado, recebimento confirmado, ajuste de estoque, plano alterado), `warn` para falha recuperável, `error` só para falha que precisa de ação, sempre com a exceção.
- Nunca logue segredo, token, hash de senha, código de recuperação, URL assinada ou dado pessoal além de IDs.

## Erros
- Todo erro devolvido segue o contrato público `ApiProblemDetails` (`public-error-contract.ts`, estilo RFC 7807): `code` (`SF-AUTH-401`, `SF-VAL-400`, `SF-DOM-400`, `SF-AUTHZ-403`, `SF-FEAT-403`, `SF-RES-404`, `SF-SYS-500`), `message`, `userMessage` em português e `traceId`. Código novo entra em `error-catalog.ts`. Sem `userMessage`, o backoffice mostra texto padrão e o `traceId`.
- 5xx nunca vaza stack ou detalhe interno em produção.
- Chamadas externas (Cloudflare R2, e-mail, CEP) com timeout e falha registrada; falha de envio não derruba a operação principal.

## Métricas
- `shared/metrics/metrics-tracker.ts` e `internal-metrics.routes.ts`. Siga o padrão de nome já usado no tracker (`snake_case`, unidade no fim: `_seconds`, `_total`).
- Tags de baixa cardinalidade: `route`, `method`, `status`, `module`. Nunca `storeId`, `tenantId`, `userId` ou `productId` como tag.
- Funcionalidade nova define na spec qual evento ou contador mostra que ela é usada e funciona.

## Saúde
- Rota `healthcheck` responde rápido e não depende de serviço externo lento. O Dockerfile usa a mesma rota no healthcheck.
- Rotas internas de métricas e de exemplo (`example.routes`, `error-example.routes`) não vão ativas para produção.
