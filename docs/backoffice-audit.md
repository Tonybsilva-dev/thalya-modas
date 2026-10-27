# Detalhe empresarial e auditoria

O detalhe da empresa separa Conta, Filiais, Usuários, Plano e funcionalidades,
e Histórico, usando Tabs do DS documentado em `apps/docs`. O histórico empresarial
inclui alterações da empresa, cadastro de filiais e mudanças de seu plano.
A aba Usuários lista as contas vinculadas à empresa; a edição continua no cadastro
global de usuários do SUPER_ADMIN.

`/backoffice/audit` consulta `GET /admin/audit`, exclusivo do SUPER_ADMIN.
Filtros: `action`, `actorId`, `targetId`, `from`, `to`, `page` e `perPage` (máximo 100).
Na interface, os filtros são aplicados automaticamente. O responsável é escolhido
pelo nome a partir de `GET /admin/audit/actors`, também exclusivo do SUPER_ADMIN;
a seleção não exige copiar identificadores. Contas removidas continuam identificadas.
Datas da API usam ISO 8601 com fuso; os campos de data da interface usam o período
completo no fuso local do navegador. A tabela exibe responsável, motivo, destino
e os valores registrados antes/depois, quando disponíveis.

Eventos: `TENANT_CREATED`, `TENANT_UPDATED`, `BRANCH_CREATED`, `USER_UPDATED`,
`PLAN_CREATED`, `PLAN_UPDATED`, `TENANT_PLAN_UPDATED` e `CONTROLS_UPDATED`.
Edição de usuários registra somente nome, e-mail, perfil e status; hashes de senha
não integram o histórico. Novos eventos não são reconstruídos retroativamente.
O histórico existente de planos e controles permanece na mesma tabela.

No PostgreSQL, as novas operações administrativas gravam alterações e auditoria
na mesma transação, incluindo a atualização dos vínculos ao mudar o perfil.
Falhas revertem os registros envolvidos. O adaptador em memória suporta testes
funcionais; a garantia transacional é verificada no PostgreSQL.

Não houve mudança de containers nem migration: a tabela existente `PlanAudit`
aceita os novos eventos. Esta etapa não implementa ainda trial, quotas, solicitações,
comunicados ou analytics. Exclusões de usuários e cadastros via autenticação ainda
não integram esta auditoria. Mudanças de usuários aparecem na auditoria global,
enquanto o histórico empresarial filtra o destino da própria empresa.
