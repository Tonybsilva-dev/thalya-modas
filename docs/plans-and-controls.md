# Planos, módulos e kill switches

O sistema segue o modelo de resolução do TrinketOS: a plataforma pode desligar
um módulo ou funcionalidade para todas as empresas. Sem esse bloqueio, a exceção
empresarial prevalece sobre o plano. Módulo e funcionalidade precisam estar
habilitados simultaneamente. Funcionalidades indisponíveis e planos não
publicados não concedem acesso.

Planos e exceções pertencem à empresa (`Tenant`) e valem para todas as filiais.
O isolamento operacional por `storeId` e as permissões de usuário continuam
obrigatórios, independentemente do plano.

## Backoffice

- `/backoffice/plans`: criação, edição, preço cadastral, publicação e arquivamento.
- `/backoffice/tenants/:id`: atribuição de plano e exceções por módulo/funcionalidade.
- `/backoffice/settings`: manutenção operacional, kill switches e histórico.
- `/backoffice`: sinalização de manutenção ou recursos desligados.

Planos em rascunho/arquivados não podem ser atribuídos. Um plano em uso e o plano
padrão não podem deixar de estar publicados. Remover uma exceção restaura a
herança do plano. Alterar um plano afeta todas as empresas associadas.

## APIs administrativas

Todas exigem sessão atual de SUPER_ADMIN:

| Endpoint | Operação |
|---|---|
| `GET /admin/features` | Catálogo com disponibilidade de módulos e funcionalidades |
| `GET /admin/analytics` | Contagens SaaS, distribuição por plano e controles globais |
| `GET /operations/plan` | Plano e acesso efetivo da empresa da filial autorizada |
| `GET/POST /admin/plans` | Listagem e cadastro |
| `PATCH /admin/plans/:id` | Edição completa do plano |
| `GET/PATCH /admin/tenants/:id/plan` | Plano empresarial, exceções e acesso efetivo |
| `GET/PATCH /admin/controls` | Kill switches e manutenção |
| `GET /admin/plan-audit` | Últimas 100 alterações, motivo e responsável |

Alterações de plano, vínculo e controles exigem `reason` com pelo menos cinco
caracteres. Os adaptadores Prisma gravam a mudança e sua auditoria na mesma
transação. As configurações são consultadas a cada operação; não exigem reiniciar
a API e não têm cache que mantenha permissões anteriores.

## Bloqueio operacional

O hook de rotas aplica o controle após autenticação e validação da filial, antes
do handler. Protege leitura e escrita de produtos/imagens, fornecedores e
contatos, pedidos de compra, recebimentos, estoque e consultas de dashboard.
SUPER_ADMIN também respeita os kill switches ao operar uma filial.

Manutenção bloqueia as rotas operacionais mapeadas. Login, recuperação de senha,
saúde, administração e gestão de planos continuam disponíveis para recuperação.
As flags de ambiente existentes continuam sendo bloqueios adicionais.

A migration `20261005070000_add_plans_and_controls` cria um plano Padrão publicado
com os recursos atuais e o atribui às empresas existentes e futuras. Nenhum
container novo é necessário. Backup local foi salvo antes da migration.

O preço é cadastral: este módulo não processa pagamentos, assinaturas, faturas,
limites de uso ou vencimentos. Na configuração PostgreSQL, os indicadores do
dashboard consultam os registros persistidos da filial. Pedidos de venda, caixa
e títulos permanecem indisponíveis no catálogo até sua implementação.

A ordem de evolução da gestão SaaS está em `saas-management-roadmap.md`.
