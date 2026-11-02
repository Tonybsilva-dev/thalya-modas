---
name: diagnosticar-producao
description: Investiga um erro relatado em preview ou produção do Store Flow (500, 401, 403, rota 404, loja errada, migration que falhou, CI vermelho) a partir de traceId, logs e sintoma, até a causa e a correção. Use quando o usuário colar um erro, log, JSON de erro ou disser que algo não funciona.
argument-hint: "[sintoma, rota ou traceId]"
---

# Diagnosticar produção

Sintoma: $ARGUMENTS

1. **Classifique** o erro antes de ler código:
   - `SF-AUTH-401` repetido → cookie/`JWT_SECRET`/`CORS_ORIGINS`, sessão suspensa ou papel alterado (a API relê o banco a cada request), `NEXT_PUBLIC_API_URL` errada.
   - `SF-AUTHZ-403` → papel sem permissão, sem `StoreMembership`, empresa suspensa, ou `X-Store-Id` obrigatório (várias filiais) / de outra empresa.
   - `SF-FEAT-403` (`details.feature`/`reason`) → plano sem a funcionalidade, exceção da empresa, kill switch ou manutenção ligados em `/backoffice/settings`, flag de ambiente `FEATURE_*_ENABLED`.
   - `SF-RES-404` em rota que deveria existir → backoffice subiu antes da API (ordem de deploy) ou imagem antiga.
   - `SF-VAL-400` → schema Zod mudou; compare com o tipo do backoffice (`contract-checker`).
   - Erro do Prisma (`P2002`, `P2025`, coluna inexistente) → migration não aplicada no ambiente (`deploy-api.yml` aplica `migrate deploy`).
   - Dado "sumiu" → conferir `storeId` ativo; read models do dashboard ainda usam memória em parte.
2. **Peça só o necessário**, sem segredos: `traceId`, rota, horário e as linhas de log daquele `traceId`. Logs longos vão ao subagente `log-analyst`.
3. Confirme qual imagem/tag está publicada (GHCR, resumo do run de `Deploy API`) e compare com a branch local (`gh run list`, `git log`).
4. Reproduza localmente quando possível (`pnpm docker:postgres:up`, `pnpm db:deploy`, `pnpm dev:api`) usando só a base `store-flow`.
5. Corrija com teste. Diga se precisa de novo deploy, de migration e em que ordem (API primeiro).

Saída: causa raiz em uma frase, evidência, correção, e como evitar que volte (teste, alerta ou regra).
