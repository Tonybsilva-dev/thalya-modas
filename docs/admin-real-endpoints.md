# ADMIN: contexto e endpoints reais

As rotas `/admin/dashboard/*` usam empresa e filial selecionadas antes de carregar dados operacionais. A API valida o vínculo, o status da empresa e da filial, as permissões e os bloqueios do plano. A troca de filial cancela consultas e remove o cache operacional anterior.

| Tela | Endpoints | Dados persistidos |
| --- | --- | --- |
| Contexto | `GET /tenants`, `GET /tenants/:id/stores`, `POST /tenants/:id/stores` | Empresas vinculadas e filiais |
| Visão geral | `GET /dashboard/overview` | Produtos, fornecedores, pedidos de compra e reposição |
| Estoque | `GET /products/page` e endpoints do catálogo | Produtos e movimentações da filial, compartilhados entre a equipe autorizada |
| Fornecedores | Endpoints do catálogo | Fornecedores, responsáveis e pedidos de compra |
| Clientes | `GET /dashboard/customers`, `GET /dashboard/customers/:id` | Contas CUSTOMER com vínculo ativo na filial |
| Relatórios | `GET /dashboard/reports` | Contagens dos registros operacionais |
| Configurações da filial | `GET/PATCH /operations/store` | Nome e telefone; alterações exclusivas do ADMIN autorizado |
| Equipe | `GET /users`, `POST /auth/register` | Membros reais; cadastro vinculado à filial ativa |

As listas de produtos e clientes recebem a paginação do servidor. Empresa, filial e equipe reutilizam os contratos paginados existentes. O layout mantém conteúdo full width, bordas retas e componentes do design system, com sidebar agrupada por operação, cadastros e gestão.

Vendas, caixa, títulos, pagamentos e notificações ainda não possuem modelos persistidos correspondentes. Essas telas apresentam indisponibilidade explícita; não substituem falhas por dados demonstrativos. As implementações antigas foram preservadas para evolução posterior.

Validação: testes de integração com PostgreSQL cobrem leitura compartilhada entre membros da mesma filial, paginação, clientes vinculados, edição da filial e bloqueio de acesso a outra empresa. Os testes do catálogo verificam persistência de fornecedores, produtos, estoque e assets.
