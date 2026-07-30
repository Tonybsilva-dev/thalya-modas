# Tela de fornecedores

## Escopo concluído

A tela de fornecedores usa o catálogo como única fonte de dados. Linhas, indicadores,
contatos, condições comerciais, pedidos e recebimentos não dependem mais do conteúdo
demonstrativo do dashboard.

| Área | Situação encontrada | Situação atual |
| --- | --- | --- |
| Listagem | Exibia pedidos de compra como se fossem fornecedores | Usa fornecedores reais e os UUIDs da API |
| Busca e filtros | Estado visual sem fluxo completo | Busca por nome/documento/e-mail/telefone, filtro de status e reset de página |
| Paginação | Sem navegação confiável | Página anterior/próxima e verificação real da existência da próxima página |
| Seleção | Sem seleção real | Seleção individual e da página visível |
| Ações em massa | Barra estática | Ativar, inativar, exportar CSV e limpar seleção |
| Indicadores | Valores demonstrativos | Endpoint agregado por loja para totais, cobertura, pedidos, valores e atrasos |
| Detalhes | Primeiro fornecedor fixo | Fornecedor selecionado, contato, condições, pedidos e próximo recebimento reais |
| Cadastro | Fluxo parcial | Validação, notas, contatos em rascunho, persistência e feedback |
| Edição | ID inválido era ignorado | Validação de UUID e estados de carregamento, erro e não encontrado |
| Responsáveis | Resumo e rotas fixas | CRUD real, contato principal único, confirmação e feedback de erro |
| Pedido de compra | Sem pré-seleção confiável | Lista todos os fornecedores ativos e respeita o fornecedor selecionado |
| Exclusão | Podia apagar histórico em cascata | Bloqueada quando existem pedidos/recebimentos; inativação preserva o histórico |
| Exportação | Inexistente | CSV da página ou dos registros selecionados |

## Hard-codes removidos

Foram removidos os fornecedores, pedidos, métricas, valores financeiros, prazos,
responsáveis, iniciais e planos de entrega demonstrativos. Também foram removidas as
rotas fixas que retornavam para `moda-brasil`.

Permanecem apenas conteúdo editorial localizado, opções do domínio (categorias,
prazos e status) e placeholders de exemplo dos campos. Esses valores não representam
dados operacionais.

## Estados de interface

- Carregamento da listagem e dos indicadores.
- Falha de listagem com nova tentativa.
- Base sem fornecedores com ação para cadastrar o primeiro.
- Busca/filtro sem resultado com ação para limpar filtros.
- Página sem registros após mudança de paginação.
- Nenhum fornecedor selecionado.
- Indicadores operacionais parcialmente indisponíveis.
- Nenhum recebimento pendente.
- Cadastro de pedido sem fornecedor ativo.
- Responsáveis carregando, vazios ou com falha.
- ID inválido, carregamento, falha e fornecedor não encontrado na edição.
- Falha ao cadastrar, editar, excluir ou alterar status.
- Criação parcial quando o fornecedor é salvo, mas algum responsável falha.

## Regras de integridade

- O documento do fornecedor é único por loja.
- CNPJ, telefone e pedido mínimo são validados no formulário.
- Apenas um responsável pode ser principal por fornecedor.
- Pedidos e recebimentos são consultados pelo fornecedor selecionado.
- Fornecedor inativo não pode iniciar um novo pedido pelo painel lateral.
- Fornecedor com pedido ou recebimento não pode ser excluído.
- As chaves estrangeiras de pedidos e recebimentos usam `ON DELETE RESTRICT`.

## Cobertura automatizada

Os testes de integração cobrem CRUD, responsáveis, filtros, indicadores agregados,
filtro de histórico por fornecedor e proteção contra exclusão de histórico. A regra
de exclusão também é executada contra Prisma/PostgreSQL.
