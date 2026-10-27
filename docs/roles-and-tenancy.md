# Papéis, empresas e filiais

O isolamento empresarial segue `Tenant (empresa) → Store (filial)`.
Cada filial tem um `tenantId` obrigatório e imutável. Uma empresa pode ter
várias filiais, com catálogo, estoque e arquivos separados por `storeId`.

| Papel | Escopo | Permissões |
|---|---|---|
| SUPER_ADMIN | Plataforma | Lista usuários e lojas, administra contas e seleciona qualquer loja por `X-Store-Id`. |
| ADMIN | Empresa | Administra todas as filiais da empresa e seus usuários; cadastra e gerencia MANAGER, EMPLOYEE e CUSTOMER locais. |
| MANAGER | Lojas às quais está associado | Gerente: acesso operacional ao catálogo e dashboard das suas filiais, como o EMPLOYEE; não administra usuários; consulta e altera o próprio nome. |
| EMPLOYEE | Lojas às quais está associado | Acesso operacional ao catálogo e dashboard; consulta e altera o próprio nome. |
| CUSTOMER | Própria conta | Consulta o perfil e altera o próprio nome. Sem acesso ao backoffice, catálogo ou dashboard internos. |

O cadastro público cria um ADMIN e inicia seu onboarding. Um SUPER_ADMIN também
pode cadastrar um ADMIN, que conclui o onboarding da sua própria loja.

O ADMIN não pode promover contas a ADMIN ou SUPER_ADMIN, alterar outro
administrador ou acessar usuários de outra empresa. Contas associadas a mais de
uma empresa exigem SUPER_ADMIN para alterações globais e exclusão. Trabalhar em
várias filiais da mesma empresa não impede essas operações. A exclusão de um
proprietário de empresa é bloqueada, inclusive para SUPER_ADMIN, evitando
apagar empresas e filiais por cascata; use suspensão da conta.

O cadastro autenticado de MANAGER, EMPLOYEE ou CUSTOMER exige uma loja autorizada e cria
a associação com ela. Informe `X-Store-Id` quando houver várias lojas ou quando
o SUPER_ADMIN operar uma loja sem associação. O token do cadastro corresponde
ao usuário criado; ele não substitui a sessão do administrador.

O banco é compartilhado entre tenants, com dados operacionais identificados por
`storeId`. A API verifica a empresa, seu status e a associação ativa antes de
acessar esses dados. MANAGER e EMPLOYEE exigem também associação ativa à filial. O
PostgreSQL do TrinketOS é compartilhado apenas como infraestrutura local; a base
`store-flow` continua separada de `trinketos`.

A API consulta o papel e o status atuais da conta em cada rota autenticada.
Suspensão, exclusão e mudanças de papel passam a valer para tokens já emitidos.
O frontend também valida a sessão com a API e restringe as páginas internas.

## Primeiro SUPER_ADMIN

Configure no arquivo local `apps/api/.env` (ignorado pelo Git):

```env
SUPER_ADMIN_NAME="Seu nome"
SUPER_ADMIN_EMAIL="seu-email@exemplo.com"
SUPER_ADMIN_PASSWORD="uma senha exclusiva com pelo menos 8 caracteres"
```

Na raiz do projeto, execute:

```powershell
pnpm.cmd admin:bootstrap
```

O comando usa a `DATABASE_URL` da API, armazena a senha com Argon2 e cria somente
o primeiro SUPER_ADMIN. Não promove uma conta existente nem substitui sua senha.
Chamadas concorrentes são serializadas no PostgreSQL. Depois de provisionar,
remova essas três variáveis do `.env` e faça login normalmente.

Outras promoções administrativas são feitas pelo SUPER_ADMIN em
`PATCH /users/:id`. A listagem global de lojas está em `GET /admin/stores`.
A área `/backoffice` é exclusiva do SUPER_ADMIN. O login dele leva a `/backoffice`,
com visão geral, empresas e filiais, gestão de usuários e configurações.
Os demais papéis são encaminhados pelo `proxy.ts` ao próprio segmento
(`/admin/dashboard`, `/manager/dashboard`, `/employee/dashboard`,
`/customer/dashboard`); um papel desconhecido vai a `/unauthorized`. Cada papel só
acessa o próprio `/:role/dashboard`, e o SUPER_ADMIN é encaminhado de volta a
`/backoffice`. As telas do ADMIN usam dados reais (ver
[ADMIN: contexto e endpoints reais](admin-real-endpoints.md)); as dos demais
papéis ainda estão em evolução.

O segmento valida a sessão com `/auth/me` no proxy e no servidor; não usa
um papel declarado pelo navegador para conceder acesso. As telas novas usam
dados da API e não dependem de uma filial ativa para administrar a plataforma.
Planos, módulos, funcionalidades, exceções empresariais e kill switches estão
disponíveis no backoffice. Consulte [planos e controles](plans-and-controls.md).
O histórico registra alterações desses controles. Cobrança e compliance
continuam fora do escopo implementado.

## Empresas e filiais

| Endpoint | Operação |
|---|---|
| `GET /tenants` | SUPER_ADMIN lista todas as empresas; ADMIN, MANAGER e EMPLOYEE listam suas associações ativas. |
| `POST /tenants` | ADMIN cria sua empresa; SUPER_ADMIN informa `ownerId` de um ADMIN ativo. |
| `GET /tenants/:tenantId` | Consulta uma empresa autorizada. |
| `PATCH /tenants/:tenantId` | ADMIN altera o nome; SUPER_ADMIN também altera `status` entre ACTIVE e SUSPENDED. |
| `GET /tenants/:tenantId/stores` | Lista as filiais acessíveis da empresa. |
| `POST /tenants/:tenantId/stores` | ADMIN da empresa ou SUPER_ADMIN cria uma filial com nome, telefone, documento e segmento. |

`TenantMembership` determina o acesso à empresa. ADMIN empresarial acessa
todas as suas filiais; MANAGER e EMPLOYEE usam também `StoreMembership` para
delimitar as filiais disponíveis. Suspender uma empresa bloqueia o acesso operacional
dos membros a todas as filiais. SUPER_ADMIN mantém acesso explícito para
administração da plataforma. CUSTOMER não acessa essas rotas administrativas.

O onboarding existente cria a empresa e a primeira filial automaticamente.
A migration `20261004220000_add_tenants` agrupa as lojas existentes por
proprietário e preserva IDs, slugs, arquivos e dados operacionais. Novas filiais
usam o endpoint da empresa. A seleção operacional continua por `X-Store-Id`;
quando houver várias filiais acessíveis, esse header é obrigatório.

## Compatibilidade

A migration `20261004210000_align_user_roles` converte `ROLE_COMPANY` para
`ROLE_ADMIN` e `ROLE_DELIVERY_MAN` para `ROLE_EMPLOYEE`. A migration
`20261005150000_add_manager_role` acrescenta `ROLE_MANAGER` às restrições de
`users` e `tenant_memberships` e ao vínculo automático de filial. O banco aceita
somente os cinco papéis da hierarquia (SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE e
CUSTOMER). Tokens antigos usam o papel atual do banco.

Os read models gerais do dashboard continuam em memória, como antes. Esta
mudança corrige autorização e isolamento dos fluxos existentes; não implementa
planos, cobrança ou um portal de clientes.
