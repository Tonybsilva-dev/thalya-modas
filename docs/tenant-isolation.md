# Isolamento de empresa e filial

## Regra

Contexto empresarial é uma autorização resolvida no servidor, não um campo escolhido livremente pelo cliente. `X-Store-Id` seleciona a filial desejada; o middleware valida usuário, vínculos e situação da empresa/filial e obtém o tenant dessa filial. O cliente não concede acesso enviando um tenantId.

Dados de uma filial não devem ser consultados, alterados, excluídos ou vinculados por outra filial, mesmo quando ambas pertencem à mesma empresa. Operações empresariais que agregam filiais precisam de autorização explícita e filtros pelo tenant. Operações públicas, de sessão e de plataforma têm escopos próprios.

## Primeira etapa implementada: catálogo

- `CatalogScope` exige `tenantId`, `storeId` e `userId`, propagados pelo contexto HTTP autorizado.
- Todas as 28 entradas públicas do repositório Prisma do catálogo verificam se a filial pertence ao tenant. Contexto ausente ou incoerente falha fechado. O adaptador em memória recebe o repositório de filiais e também confere a relação filial/empresa, inclusive para chamadas diretas.
- Gravações de fornecedor, contato, produto, estoque, compra, recebimento e imagem incluem escopo no filtro final. As leituras permanecem filtradas por filial, cuja relação com o tenant é conferida na entrada.
- Upload de imagem confere a bucketKey contra a filial persistida, além de validar o produto.
- Recebimento vinculado a pedido exige o mesmo fornecedor e a mesma filial.
- Triggers do PostgreSQL impedem mudar `store_id` e vinculam os registros à filial de seus pais em suppliers, supplier_responsibles, products, product_image_assets, inventory_movements, purchase_orders, purchase_order_items e receivings.
- A migration verifica vínculos antigos antes de instalar os guards; não corrige nem move registros silenciosamente. As relações são verificadas com locks de chave compartilhada. A imutabilidade já existente de Store.tenantId mantém a relação filial/empresa estável.

Migrations: `20261027160000_catalog_scope_guards` e `20261027161000_scope_guard_record_dispatch`. A segunda mantém o despacho da função por tabela antes de acessar campos específicos do registro do trigger.

## Testes de regressão

`tests/integration/catalog/catalog-isolation.spec.ts` cobre:

1. Header de outra empresa negado e IDs de outra filial autorizada não expostos para GET/PATCH/DELETE.
2. Tenant, filial e usuário forjados no payload não alteram o contexto da criação.
3. Contato, fornecedor, produto, compra e recebimento não podem ser cruzados entre filiais; recebimento também não pode trocar fornecedor do pedido.
4. Chamadas diretas ao repositório recusam tenant/filial incoerentes e contexto ausente.
5. Gravações Prisma que bypassam o repositório são rejeitadas pelos guards quando os vínculos cruzam filiais.
6. Registros existentes não podem ser movidos para outra filial/empresa por UPDATE.

Fixtures têm usuários/lojas próprios e limpeza por IDs; os testes não reatribuem dados reais.

## Limites e continuidade

Esta etapa reforça o catálogo e seus vínculos, não constitui uma auditoria concluída de toda a API. Clientes, vendas, caixa, dashboard, administração e sessões já têm mecanismos de escopo específicos, mas ainda precisam da revisão equivalente ao serem trabalhados. Não foi ativado Row Level Security: os triggers protegem integridade das gravações, não filtram SELECT executado diretamente com credenciais de banco.

Não alterar neste trabalho as decisões pendentes de campos opcionais, política por operação, fornecedor inativo ou unicidade concorrente do contato principal. Essas pendências estão em `supplier-registration-audit.md` e continuam distintas de isolamento empresarial. Transferências entre filiais não são uma edição comum de storeId e permanecem um fluxo futuro.


## Validação desta etapa

Suíte completa aprovada com Redis e PostgreSQL reais: **58 arquivos e 493 testes**. Os seis testes adicionais de isolamento ficam em `catalog-isolation.spec.ts`; incluem checks HTTP, chamadas diretas aos adaptadores e tentativas de gravação inválida no banco. TypeScript (`tsc --noEmit`) e Biome completo da API aprovados. As migrations foram aplicadas no banco existente, sem criar containers.
