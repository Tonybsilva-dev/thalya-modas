# Telas autenticadas — implementação

Revisão de 27/10/2026, seguindo `brand-manual.md` versão 3 e a camada `@store-flow/ui` sobre TrinketOS.

| Tela | Comportamento disponível |
| --- | --- |
| Visão geral | Indicadores da API, reposição de estoque, consulta por SKU e atalhos aos cadastros |
| Pedidos de venda | Conclusão com estoque e parcelas, recebimento inicial, busca, detalhe e cancelamento de pedido sem recebimentos |
| Caixa | Abertura, recebimentos, suprimento, sangria, conferência e histórico de fechamentos |
| Conta do cliente | Parcelas por pedido, saldo, vencimento, atraso e pagamentos parciais ou integrais |
| Clientes | Cadastro comercial, busca, detalhe, edição e inativação; sem exigir conta de acesso |
| Produtos e estoque | Consulta e filtros, leitura de código, cadastro e edição, fornecedor opcional e produto sem controle de saldo |
| Fornecedores e compras | Consulta, cadastro, edição, contatos, pedidos de compra e recebimentos já integrados |
| Relatórios | Indicadores reais e acesso aos registros de origem; sem gráficos de vendas ou exportação fictícia |
| Preferências | Tema do navegador e encerramento global de sessões com confirmação |
| Filial | Consulta dos dados; edição de nome/telefone para ADMIN; sincronização com seletor da sidebar |
| Equipe e acesso | Busca e paginação de usuários, cadastro de gerente/funcionário pelo ADMIN, sem substituir sua sessão |
| Plano | Identificação do plano e busca de funcionalidades com acesso e motivos informados pelo servidor |
| Sobre | Versão consultada em `/health`, contexto da filial e orientação de suporte; removidos contatos, SLA e datas de exemplo |

## Vendas, caixa e conta do cliente

- **Pedidos de venda:** busca e paginação, nova venda com produtos cadastrados, consumidor avulso ou cliente, quantidades, preços conferidos no servidor, vencimentos e recebimento inicial. Detalhe com itens, parcelas e pagamentos; link direto `/[role]/dashboard/orders/[orderId]`. Cancelamento por ADMIN/MANAGER somente sem recebimentos, com motivo, recomposição do estoque e preservação do histórico.
- **Caixa:** um caixa aberto por filial, fundo inicial, recebimentos separados em dinheiro/Pix/cartão, suprimento, sangria, conferência, fechamento e histórico paginado. Só o dinheiro entra no saldo físico. ADMIN/MANAGER fazem sangria, suprimento e fechamento; equipe operacional registra vendas e recebimentos.
- **Conta e promissórias:** acesso no detalhe do cliente, parcelas por pedido, vencimento, saldo, atraso e histórico de recebimentos parciais ou integrais. Atraso depende de saldo e vencimento anterior à data atual de Fortaleza; a virada do mês sozinha não implica atraso.
- **Persistência:** tabelas normalizadas em PostgreSQL, valores em centavos, estoque e finanças na mesma transação. Trava por filial serializa operações; índice parcial garante caixa único; chaves idempotentes evitam duplicação ao repetir vendas, pagamentos e movimentos.
- **Produtos avulsos:** não exigem saldo e não geram movimentação de estoque. Vendas a prazo exigem cliente; consumidor avulso exige quitação integral. Cada conclusão cria um pedido independente.
- **Indicadores:** visão geral e relatórios incluem vendas concluídas, valor vendido e saldo a receber da filial; sem séries ou valores inventados.

As operações transacionais exigem o driver PostgreSQL. O modo em memória não simula uma venda concluída. Pix/cartão representam registro de recebimento confirmado pelo operador, sem integração com adquirente ou banco. Devolução e estorno de vendas pagas, emissão fiscal, assinatura/impressão jurídica de promissória, exportação e transporte de e-mail permanecem fora desta base; uma venda paga não pode ser apagada/cancelada silenciosamente. Configurações de gateway e notificações não são apresentadas como integrações concluídas.

## Interface compacta

Seções de formulário planas, controles com altura consistente, prefixo `R$` pelo componente publicado do TrinketOS, indicadores da visão geral em StatCards compactos do TrinketOS e respeito global a movimento reduzido. O formulário de fornecedor agrupa dados, contatos, condições comerciais e observações em uma superfície. Consulte `brand-manual.md`, versão 3.1.

## Permissões e segurança

Gerenciamento de equipe e plano é exposto ao ADMIN. Dados da filial podem ser consultados pelos demais perfis operacionais, respeitando a API; os campos de edição ficam desabilitados. As ações continuam sujeitas às permissões do servidor.

Encerrar sessões pede confirmação, chama `POST /auth/logout-all`, limpa o cache local e retorna ao login após sucesso. As novas rotas mantêm autorização no servidor, contexto de filial e bloqueios do plano.

## Validação

Suíte completa da API aprovada: 486 testes, incluindo Redis e PostgreSQL reais. O teste adicional de hierarquia e o caso de repetição de movimento após troca de caixa passaram na suíte focada de vendas (8 testes). Backoffice: 39 testes aprovados, incluindo preservação de centavos em valores brasileiros e decimais canônicos. TypeScript de API, UI, backoffice e documentação, lint e builds de produção do backoffice/Storybook aprovados. Essas verificações não equivalem a navegação E2E.

Na primeira rodada completa, Docker Desktop estava desligado e as dependências falharam. O Desktop foi iniciado e os containers existentes de Postgres e Redis voltaram a responder, sem provisionamento novo; a rodada seguinte passou. A inspeção visual foi interrompida pelo controle de navegador por não conseguir determinar a URL com segurança. A conferência final de temas, foco, responsividade e interação permanece pendente.

Verificações manuais: criar venda com produto de estoque e avulso; conferir conta e vencimentos; receber parcialmente em Pix e em dinheiro; conferir saldo físico e fechar caixa; cancelar pedido sem recebimentos; trocar filial; revisar formulários com teclado, temas claro/escuro e movimento reduzido em 375/768/1024/1440 px.


## Fornecedores em Sheet

Cadastro, edição e contatos abrem em painel lateral na listagem, utilizando `@trinketos/ui/sheet`; a exclusão usa `@trinketos/ui/confirm-dialog`. A listagem permanece montada e conserva busca, filtros, página e seleção. Links anteriores redirecionam para `?supplierAction=create|edit|contacts|delete`, com o fornecedor selecionado em `supplier`. Pedidos de compra mantêm suas páginas próprias.

Contatos podem ser gerenciados dentro do painel de cadastro sem outro overlay; os campos do fornecedor permanecem montados enquanto a seção de contatos aparece. Descarte de rascunho exige confirmação, inclusive contatos ainda não persistidos de um fornecedor novo, e gravações em andamento bloqueiam fechamento. Queries de fornecedores e seus históricos agora incluem a filial no cache. A verificação de próxima página mantém o tamanho da página em vez de usar deslocamento com `perPage: 1`.

As regras de campos e contratos de backend não foram alteradas nesta revisão. A validação automática cobre resolução das ações, compatibilidade de URLs antigas, tipagem, lint e compilação. A interação completa do Sheet por teclado, foco, temas e telas menores ainda deve ser conferida visualmente.


Validação automática da migração de fornecedores para Sheet: 47 testes do backoffice aprovados, incluindo links antigos, atalho direto de contatos e isolamento dos rascunhos entre filiais; TypeScript de UI, aplicação e documentação, ESLint e builds de backoffice/Storybook aprovados. Cliques no fundo não descartam o formulário; fechamento ocorre por ação explícita, com confirmação quando há rascunho. Inspeção de interação visual ainda pendente.
