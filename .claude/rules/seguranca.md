# Segurança

## Segredos
- Nunca peça para o usuário colar token, senha ou chave no chat. Peça que coloque no `.env` do app e confirme só o **nome** da variável.
- Se um segredo aparecer no chat, num log ou numa nota, avise o usuário para **rotacionar** e não o repita em nenhuma resposta, commit ou arquivo.
- Exemplos de configuração vão em `.env.example`, sempre com valores vazios ou fictícios óbvios.
- As variáveis `SUPER_ADMIN_*` do bootstrap são temporárias: lembre o usuário de removê-las do `.env` depois de `pnpm admin:bootstrap`.

## Multi-tenant (Tenant → Store)
- Todo dado operacional (produto, fornecedor, estoque, pedido, recebimento) filtra por `storeId` do `request.storeContext`, resolvido por `storeContextMiddleware`. Nunca confie em `storeId`/`tenantId` vindo do corpo ou da query.
- A API consulta papel e status atuais da conta em cada rota autenticada. Não cacheie permissão.
- ADMIN só administra a própria empresa e nunca promove a ADMIN/SUPER_ADMIN. EMPLOYEE exige `StoreMembership` ativa. CUSTOMER não acessa o backoffice.
- SUPER_ADMIN opera uma loja só por `X-Store-Id` explícito e respeita os kill switches.
- Exclusão de proprietário de empresa é bloqueada (use suspensão). Histórico de fornecedor com pedido ou recebimento não é apagado em cascata.

## Planos e controles
- Bloqueio de funcionalidade é no backend (`plan-gate`, `featureFlags`), nunca só escondido no backoffice.
- Mudança de plano, vínculo e kill switch exige `reason` (mín. 5 caracteres) e gera auditoria na mesma transação.

## Superfícies públicas e uploads
- Rotas públicas (login, registro, recuperação de senha, saúde): valide com Zod, limite tamanho, não revele se um e-mail existe, não exponha código de verificação em produção.
- Upload de imagem: só WebP, tamanho limitado, chave do arquivo com `storeId` (Cloudflare R2), nunca confie no nome enviado.
- Senhas com Argon2. JWT em cookie httpOnly ou bearer; `JWT_SECRET` obrigatório em produção.
- CORS só pelas origens de `CORS_ORIGINS`.

## Backoffice
- Nada sensível em `NEXT_PUBLIC_*`. O acesso é decidido por `/auth/me` no `proxy.ts` e no servidor, nunca por papel declarado pelo navegador.
- Sem `dangerouslySetInnerHTML` com dado do usuário.
