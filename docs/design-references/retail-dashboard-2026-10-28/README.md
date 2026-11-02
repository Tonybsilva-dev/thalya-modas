# Referências fornecidas — reformulação do Store Flow

Fonte: 15 imagens anexadas pelo responsável nesta conversa em 28/10/2026. Uso solicitado: reformulação geral das telas e consulta permanente. Direção normativa: [manual vigente](../../brand-manual.md).

## Preservação do material

**19 pranchas JPEG da fonte pública original estão arquivadas nesta pasta**, sem alterações, como `source-01.jpg` a `source-19.jpg`. Abra a [galeria local](gallery.html) para consultar todas as imagens. O [manifesto](manifest.json) registra URL, dimensões, tamanho e SHA-256 de cada arquivo.

A origem identificada é [Sprinta — Sneaker Inventory & POS Management SaaS, Opedia Studio / Samsun Nahar](https://opediastudio.com/projects/sneaker-inventory-pos-management-saas), também publicado no [Behance](https://www.behance.net/gallery/237442801/Sneaker-Inventory-POS-Management-SaaS-UX-UI-Design). A prancha `source-13.jpg` corresponde à visão geral R10; as imagens da conversa incluem recortes e versões redimensionadas desse projeto. Os binários exatos dos anexos não foram expostos pelo ambiente: o arquivo preservado é o material público de origem. `source-page.html` registra a página consultada em 28/10/2026. A disponibilidade pública não transfere direitos de autoria ou licença de distribuição da fonte Hellix.

O arquivo `reference-board.svg` é um esquema vetorial de autoria desta implementação, para consulta de paleta/composição; não é uma reprodução nem um original dos anexos. Nenhuma imagem de tênis, marca de pagamento ou símbolo do projeto de referência foi incorporada ao produto.

## Catálogo, na ordem dos anexos

| ID | Imagem / dimensões exibidas | Elementos observados | Aplicação Store Flow |
| --- | --- | --- | --- |
| R01 | Estoque desktop · 1228 × 872 | Trilho vertical branco, cabeçalho horizontal, chips, quatro indicadores azul/menta/rosa/creme, tabela, alertas e gráficos | Shell, indicadores, inventário e seleção de registro |
| R02 | Detalhe dos gráficos · 1376 × 725 | Semicírculo azul segmentado e curvas azul/laranja, tooltip escuro e coluna translúcida | Linguagem visual; usar somente dados históricos disponíveis |
| R03 | Visão geral mobile · 333 × 678 | Cabeçalho compacto, chips horizontais, indicador azul e bloco de inventário | Reflow e hierarquia móvel |
| R04 | Catálogo mobile · 309 × 917 | Duas colunas de produtos, imagens em superfície neutra, preço e saldo, botão leve | Modo visual de catálogo com imagens reais |
| R05 | Inventário mobile · 300 × 811 | Indicadores horizontais, busca/filtro e tabela contida com registro azul selecionado | Inventário responsivo e seleção explícita |
| R06 | Carrinho mobile · 316 × 734 | Produto, variação, quantidade, remoção, resumo e pagamento azul | Composição de venda; preservar parcelas e recebimentos existentes |
| R07 | Indicadores mobile · 317 × 837 | Pedidos com curva, crescimento semicircular e ranking de produtos | Composição analítica; não inventar crescimento ou histórico |
| R08 | Alertas mobile · 291 × 829 | Marca/participação, alertas de reposição com produto e curva temporal | Alertas derivados dos saldos reais |
| R09 | Catálogo e carrinho desktop · 807 × 573 | Trilho, catálogo de três colunas e resumo de carrinho à direita | Organização de catálogo e composição de venda |
| R10 | Overview desktop · 842 × 721 | Quatro indicadores, inventário e vendas recentes, três módulos analíticos inferiores | Grade de visão geral com um indicador de destaque |
| R11 | Cards e componentes · 638 × 746 | Cards muito arredondados, fundos cinza claros, pílulas e controles circulares | Raios, superfícies e composição de componentes |
| R12 | Grid · 650 × 365 | Grade desktop de 12 colunas e móvel de 4; medidas ilustrativas de 85/76 px | Grade fluida, não colunas fixas em pixels |
| R13 | Cores · 648 × 563 | Azul #3282DE, branco #FFFFFF, preto #000000, escuro #262626, cinza #F5F5F5 | Primitivos de marca e mapeamento semântico acessível |
| R14 | Tipografia · 652 × 830 | Hellix Light/Regular/Medium/Semibold/Bold; amostras 56/32/20 px | Hellix como referência; fallback Inter enquanto não houver fonte distribuível |
| R15 | Notificação · 337 × 334 | Toast preto flutuante com ícone azul, título/descrição e horário | Feedback breve, sem substituir erros persistentes de formulário |

## Decisões extraídas

- Azul #3282DE como primitivo expressivo. Botões com texto branco usam derivação #2874C8 para contraste de texto normal: o azul original com branco mede aproximadamente 3,90:1.
- Área de trabalho branca, módulos cinza muito claro, bordas discretas e sombras mínimas. Tema escuro é uma adaptação própria; não foi mostrado nos anexos.
- Cards de 24 px de raio, controles/pílulas com raio pleno, linhas de tabela com extremos arredondados. O sistema de raios retos da versão 4 é histórico.
- Indicador principal azul; demais indicadores usam menta, rosa, creme e azul pálido com texto legível. Rótulos e valores correspondem à API, sem percentuais decorativos.
- Trilho desktop com ícones de navegação, nome acessível, tooltip e rota ativa circular. No mobile, menu rotulado em Drawer/Sheet e cabeçalho compacto.
- Inventário com tabela e modo de catálogo visual, miniaturas reais, destaque de seleção e detalhe contextual. Não inserir fotografias de produtos da referência como se fossem cadastros reais.
- Caixa/venda com separação clara entre itens e resumo financeiro. Pix/cartão permanecem registros de recebimento; a referência não autoriza integração de pagamento inexistente.
- Texto operacional de 14 px; títulos de 24–28 px. A escala 56 px do painel tipográfico é editorial e não vira cabeçalho operacional.

## Uso contínuo

Consultar esta pasta, a galeria e o manual antes de modificar UI. O requisito está registrado no `AGENTS.md` da raiz e em `design-system/store-flow-backoffice/MASTER.md`. Preservar os JPEGs sem alterações; registrar novos arquivos no manifesto com origem e hash. As imagens são referências documentais e não assets do catálogo comercial do Store Flow.
