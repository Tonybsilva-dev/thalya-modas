# Referências de varejo para o Store Flow

Pesquisa consultada em 27/10/2026. Este documento fundamenta o manual de marca e os padrões de interface. As recomendações são decisões do Store Flow; não são uma reprodução das telas internas das empresas citadas.

## O que conseguimos verificar

| Referência | Evidência pública | Aplicação proposta no Store Flow |
| --- | --- | --- |
| Americanas | A companhia descreve foco em lojas físicas e integração complementar com o digital. A Oracle publica um caso de infraestrutura, não um guia do PDV. | Priorizar a operação física, contexto da filial e continuidade entre tarefas. Não inferir o visual interno a partir de seu site de vendas. |
| Besni | O histórico institucional registra moda, centro de distribuição e canais digitais. O portal oficial do cartão oferece consulta de fatura/extrato e atendimento em loja. | Separar cadastro do cliente, pedidos e obrigações de pagamento. Uma consulta financeira deve deixar origem, vencimento e situação evidentes. Isso não implica adotar cartão ou regras de crédito da Besni. |
| Polo Caruaru | A Prefeitura descreve conexões entre expositores e compradores do polo. Um case da Cubo9 relata painéis individuais para lojistas, catálogo, estoque e pedidos em um projeto para o Polo Caruaru. O relato do fornecedor não constitui auditoria independente. | A interface precisa servir ao pequeno lojista e ao atacadista: linguagem simples, busca rápida e separação de empresas. Compra por volume e preço de atacado são hipóteses de produto para evolução, não recursos atuais. |
| Linx Microvix | A apresentação oficial organiza frente de loja, estoque, compras e gestão multiloja; cita códigos de barras e grade de tamanhos/cores. | Separar operação e retaguarda; catálogo pesquisável, indicadores de saldo e fornecedor próximos ao produto. Não anunciar grades ainda inexistentes. |
| Shopify POS | A documentação descreve carrinho por cliente, produtos, pagamento, pedidos e sincronização de estoque por local. A referência rápida também documenta item avulso. | Dar à venda uma sequência curta e explícita. Preservar a distinção entre produto cadastrado sem controle de saldo e item personalizado de uma venda; não são o mesmo conceito. |

Fontes primárias:

- [Americanas — história institucional](https://sa.americanas.io/americanas/nossa-historia/).
- [Oracle — caso Americanas](https://www.oracle.com/br/customers/americanas/).
- [Besni — história institucional](https://institucional.besni.com.br/historia/).
- [Portal oficial do Cartão Besni](https://cartaobesni.com.br/).
- [Prefeitura de Caruaru — perguntas frequentes sobre o polo e negócios](https://cmm.caruaru.pe.gov.br/faq).
- [Cubo9 — relato do projeto Polo Caruaru](https://cubo9.com/casos/polo-caruaru/).
- [Linx — Microvix](https://www.linx.com.br/erp-microvix/).
- [Shopify — venda presencial](https://help.shopify.com/pt-BR/manual/sell-in-person/shopify-pos).
- [Shopify — referência rápida de uma venda](https://help.shopify.com/en/manual/sell-in-person/shopify-pos/process-sales-transaction).

## Limites da comparação

Não encontramos documentação pública suficiente para identificar e reproduzir com segurança o layout do PDV ou da retaguarda de Besni e Americanas. Não foi confirmado um fornecedor de ERP da Besni. Não atribuir Linx, TOTVS ou outro produto a essas redes sem evidência específica.

Páginas de comércio eletrônico mostram a experiência do consumidor; não comprovam a experiência do operador. A preferência pela Americanas é usada como referência de amplitude operacional — loja, estoque, cliente e rede — e não como autorização para copiar identidade, vermelho de marca, campanhas ou interface interna.

## Conclusões de design do Store Flow

Estas são inferências e decisões de produto derivadas da comparação, sem atribuição às interfaces internas das redes:

1. **Dois ritmos de trabalho.** O caixa deve favorecer a sequência item → pedido → pagamento. A gestão favorece buscar → consultar → agir. Não aplicar uma mesma grade de cards a ambas as tarefas.
2. **A loja ativa acompanha a operação.** Empresa e filial ficam no dropdown da sidebar; não ocupam novamente o cabeçalho de cada página. Nome e identidade visual da filial ajudam a prevenir ações no contexto errado.
3. **Listas são a área principal da retaguarda.** Busca, filtros e criação ficam antes da tabela. Métricas só aparecem se ajudarem uma decisão naquele contexto; nunca empurram as ações principais para baixo.
4. **Cadastro progressivo.** Pedir primeiro identificação e dados necessários. Dados complementares aparecem em seções claras. Não exigir conta de acesso para cliente comercial nem fornecedor para todo produto.
5. **Financeiro exige rastreabilidade.** Nos módulos futuros, mostrar pedido de origem, valor original, pagamentos, saldo e vencimento. O mês da compra não determina atraso. A interface não pode deduzir quitação de um estado visual ou ocultar saldo parcial.
6. **Rapidez sem atalhos fictícios.** Favorecer leitor de código de barras, teclado, rótulos e foco. Só mostrar atalhos que estejam implementados. Contingência offline, fiscal e integração de pagamentos não são presumidos.
7. **Uma marca operacional própria.** Azul sóbrio, texto legível, superfícies neutras, baixa ornamentação e densidade controlada. Componentes TrinketOS fornecem comportamento; os tokens e a composição pertencem ao Store Flow.

## Prioridade de aplicação

Padronizar primeiro o shell, os cabeçalhos, as listagens de clientes/produtos/fornecedores e os formulários. As páginas da plataforma usam a mesma linguagem, com contexto administrativo separado. Vendas, caixa e promissórias só recebem a composição operacional completa quando o comportamento transacional existir; não transformar mockups em promessa de funcionalidade.

Os critérios concretos estão em [brand-manual.md](brand-manual.md). O catálogo visual fica no Storybook, em **Store Flow / Manual da marca**.
