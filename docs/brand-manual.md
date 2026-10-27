# Store Flow — manual de identidade e interface

Versão 3.2 · 27/10/2026. Direção escolhida: azul sóbrio, próximo da identidade atual. Base de componentes: `@trinketos/ui@0.2.0`.

Este é o manual próprio do Store Flow. Fonte de consulta para implementação, revisão e evolução do produto. A referência de mercado e seus limites estão em [retail-reference-study.md](retail-reference-study.md). O TrinketOS fornece a base comportamental dos componentes; não define a marca do Store Flow.

## Personalidade

Clareza, confiança e agilidade para quem opera uma loja. A interface deve deixar a tarefa aparecer antes da decoração. Texto direto, frases curtas e ações com verbos: cadastrar cliente, salvar produto, confirmar plano.

## Marca

Nome: **Store Flow**, sempre com espaço e iniciais maiúsculas. Manter os arquivos de marca existentes; esta etapa não redesenha o símbolo. Usar assinatura de 28–32 px no aplicativo e área livre equivalente a 8 px. Não acrescentar brilho, sombra colorida ou slogan na navegação.

## Cores

| Token | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| Fundo | `#f8fafc` | `#101820` | Área de trabalho |
| Superfície | `#ffffff` | `#17212d` | Formulários e tabelas |
| Texto | `#172435` | `#e8edf4` | Conteúdo principal |
| Texto secundário | `#526176` | `#a6b3c5` | Ajuda e metadados |
| Primária | `#28548a` | `#8bb7ed` | Ação principal, seleção e foco |
| Borda | `#dce3ec` | `#334155` | Separação discreta |

Cor primária concentrada em uma ação principal por contexto. Estados usam texto e cor: sucesso, atenção e erro têm significado funcional, sem grandes áreas saturadas. Não usar cores literais nas telas novas; usar tokens semânticos.

## Tipografia e densidade

Fonte funcional: Inter, com fallback de sistema. Corpo de 14 px/20 px; campos de 14 px; título da página de 22–24 px; seção de 16 px. Números financeiros alinhados e tabulares. Nunca reduzir legibilidade para caber mais informação.

Escala de espaçamento: 4, 8, 12, 16, 24 e 32 px. Conteúdo operacional com 16–20 px de margem; formulário com 16–24 px de padding. Controles desktop de 36–40 px; controles de autenticação e toque de pelo menos 44 px. Tabelas com linhas de aproximadamente 44 px e ações próximas ao registro.

## Estrutura das telas

- Cabeçalho compacto: título, contexto indispensável e ação principal.
- Busca e filtros na mesma região da tabela, com filtros adicionais expansíveis quando necessário.
- Listagem como conteúdo central; indicadores apenas quando ajudam a decidir naquela tarefa.
- Evitar painéis laterais decorativos, hero com fotografia e repetição do nome da loja.
- Formulário de cadastro sem banner ou métricas; rodapé de ações acessível, rolagem interna quando necessário.
- Estados vazio, carregando, erro e sucesso com instrução clara. Erros mostram referência de suporte copiável, nunca stack trace.
- No celular, priorizar uma coluna e alvos de toque maiores. Não ocultar ações essenciais para evitar rolagem.

## Componentes e tokens

`packages/ui` funciona como camada de adaptação do pacote publicado. Primitivos compatíveis usam os componentes TrinketOS; componentes específicos continuam locais até migração equivalente validada. Não copiar a identidade do TrinketOS: sobrescrever tokens na camada Store Flow.

O pacote 0.2.0 declara React 18, enquanto o aplicativo usa React 19. Compilação e testes de interação são obrigatórios antes de expandir a migração; não alterar a versão do React para esconder essa diferença. Manter a versão do pacote fixada para atualizações revisáveis.

## Critérios de revisão

Verificar 375, 768, 1024 e 1440 px; temas claro e escuro; navegação por teclado; foco visível; erro anunciado; zoom de 200%; rótulos associados; movimento reduzido. Em desktop, título, busca e ação principal devem aparecer antes de qualquer rolagem. O manual define a direção; verificações visuais só são consideradas realizadas quando registradas com evidência.


## Conceito da marca: clareza para operar

Store Flow organiza o trabalho de uma loja para que a equipe saiba onde está, o que precisa fazer e o que aconteceu depois de uma ação. O foco é balcão e retaguarda, de uma pequena loja a uma operação com várias filiais. A marca deve parecer confiável e próxima, sem linguagem de campanha ou vocabulário corporativo desnecessário.

Pilares: **clareza**, **ritmo**, **rastreabilidade** e **contexto**. Em cada tela, a pergunta de revisão é: qual tarefa o operador consegue concluir aqui e qual informação realmente precisa permanecer visível?

A marca do sistema não substitui a identidade da loja: Store Flow é a plataforma; empresa é o negócio; filial é o contexto operacional. Logo próprio, quando fornecido, pertence à empresa/filial e não muda as cores semânticas de erro ou sucesso.

## Padrões canônicos de página

| Tipo | Estrutura obrigatória | Evitar |
| --- | --- | --- |
| Listagem | Título e ação → busca/filtros → tabela → paginação | Hero, resumo lateral automático e cards de métricas grandes |
| Cadastro/edição | Breadcrumb quando necessário → título → seções de campos → ações de salvar/cancelar | Campos em uma coluna estreita com grandes vazios e explicações repetidas |
| Detalhe | Identificação e situação → dados principais → histórico relacionado | Dados fictícios para preencher espaço e ações desconectadas do registro |
| Visão geral | Indicadores comprováveis e pendências acionáveis → acesso aos cadastros | Gráfico decorativo, faturamento estimado e promessa de módulos ausentes |
| Configurações | Seções por assunto e campos editáveis autorizados → salvar explícito | Misturar preferências pessoais com controles globais sem separação |
| Caixa futuro | Busca/leitura → itens → cliente quando aplicável → total/pagamento | Carregar o caixa com todos os relatórios e menus da retaguarda |
| Conta do cliente futura | Pedidos de origem → títulos e vencimentos → pagamentos e saldo | Misturar status do pedido, da parcela e da conta em um único badge |

### Cabeçalho

Usar `PageHeader` da camada Store Flow sobre o componente publicado TrinketOS. Título de 24 px, peso 600, descrição curta de 14 px. Uma ação primária, ações secundárias com menor ênfase. No mobile, ações quebram em linha abaixo; nenhuma barra fixa deve encobrir o conteúdo. Não repetir seletor de empresa, logo e filial no conteúdo.

### Superfícies e campos

`PageLayout` estabelece o ritmo de 16 px entre regiões. `PageSection` agrupa campos relacionados em seções planas, separadas por borda, sem criar um card por seção; título de seção de 16 px, sem ícone decorativo obrigatório. Grade de uma coluna no mobile e duas em desktop quando os campos forem curtos. Descrição, observações e linhas de pedido podem ocupar largura total.

`PageToolbar` mantém busca e filtros juntos, antes da tabela. Tabelas usam texto de 14 px, cabeçalho de 12–13 px, números alinhados à direita e valores tabulares. Rodapé de paginação pertence à listagem. Detalhes complementares só aparecem por ação do operador ou quando essenciais à tarefa.

`FormActions` mantém salvar/cancelar ao alcance sem sombra forte, blur ou efeito flutuante. Ações destrutivas recebem separação e confirmação conforme o efeito. Salvar mostra andamento e resultado; não duplicar submissão por clique repetido.

### Navegação

A sidebar mantém a identidade e o seletor de filial no topo e a conta no rodapé. Grupos expansíveis usam modo single, com o grupo da rota atual aberto. Links internos ocupam toda a largura. Espaçamento: 4 px entre links, 4 px do título para o primeiro link e 8 px após um grupo aberto. Itens têm ao menos 40 px em desktop e 44 px em toque. Não usar altura fixa no conteúdo expandido.

## Linguagem e dados

- Dizer “Novo cliente”, “Cadastrar produto”, “Salvar alterações”, “Filial ativa”. Evitar “workspace”, “pulse”, “lifetime” e slogans em telas operacionais.
- Distinguir pedido de compra e pedido de venda. Produto avulso sem controle de estoque continua sendo um produto cadastrado.
- Valores em BRL com duas casas decimais e datas de acordo com o idioma escolhido. Mostrar fuso e horário quando houver risco de ambiguidade.
- Quantidade, custo, preço e saldo são conceitos diferentes. Não substituir ausência de informação por zero financeiro.
- Status sempre inclui texto. Vencido/atrasado exige regra de vencimento e saldo; a cor vermelha não define a regra de negócio.
- Não exibir cadastro, envio de e-mail, pagamento ou sincronização como concluído antes da confirmação correspondente.

## Catálogo consultável e implementação

O Storybook inclui **Store Flow / Manual da marca**: paleta semântica real, densidade, uma listagem e um formulário de referência. Exemplos são identificados como dados ilustrativos e não são registros da aplicação.

Componentes base já provenientes do pacote publicado: botão, input, checkbox, label, card, tabela e acordeon. `PageHeader` e `StatCard` também usam o pacote. `PageLayout`, `PageToolbar`, `PageSection` e `FormActions` são composições próprias; não duplicam as regras de negócio das páginas. Usar a camada `@store-flow/ui` para preservar um único ponto de adaptação.

A consulta da skill de UI/UX nesta revisão sugeriu Flat Design, mas também retornou um padrão promocional de showcase. Adotamos a orientação de superfícies simples; descartamos hero, prova social e repetição de CTAs porque não servem à operação de loja. A cor azul escolhida pelo usuário permanece a direção da marca.

## Revisão e manutenção

Mudanças de cor, fonte, densidade, navegação ou padrão de página devem atualizar este manual e o exemplo do Storybook na mesma entrega. Layout não comprova funcionalidade: registrar separadamente o que foi compilado, testado e inspecionado no navegador. O manual não deve alegar que reproduz sistemas privados de Americanas ou Besni.


## Densidade, moeda e interação — versão 3

Preferir uma superfície contínua de formulário com divisórias. Cards ficam reservados a tabelas ou grupos independentes; não usar alturas mínimas para preencher espaço nem forçar painéis de resumo ao lado de formulários. Na visão geral, indicadores usam o `StatCard` publicado do TrinketOS: valor destacado, rótulo legível e descrição curta em superfície delimitada. Cinco cards iguais na linha de desktop, com espaçamento de 12 px e distribuição responsiva; não deixar um indicador isolado em segunda linha no desktop amplo. A grade mantém alturas uniformes sem altura fixa, permitindo quebra de texto e zoom. Faixas de definições ficam para resumos secundários. Espaçamento entre regiões: 12 px; entre label e campo: 6 px; entre campos: 12 px. Controles padrão: 40 px, com alvo de ao menos 44 px em dispositivos de ponteiro grosso.

Campos de dinheiro usam `CurrencyInput`, composição do **Input publicado do TrinketOS**, com o slot `prefix` preenchido por `R$`. Não usar ícone de dólar ou um elemento absoluto sobre o campo. O label informa a grandeza e a moeda; o prefixo visual é decorativo para leitores de tela. Valores transacionais são convertidos em centavos inteiros no contrato da API. Preços e totais não são calculados com floats no servidor.

Foco deve permanecer visível em botões, links, seletores e inputs. Labels são associados aos controles, falhas usam alertas e conclusões usam regiões de status. Diálogos usam foco e navegação de teclado do Radix; não fechar durante uma gravação. Usar estados de validação e slots do componente em vez de sobrepor decoração manual.

Temas claro/escuro usam exclusivamente os tokens semânticos. Bordas, prefixos, superfícies, estados e foco devem continuar legíveis nos dois temas; não fixar branco/preto nos formulários. Motion usa os tokens compartilhados e as transições dos componentes: foco/hover, entrada e saída de menus/diálogos e expansão de navegação. Nenhuma animação decorativa contínua. `prefers-reduced-motion` remove atrasos, reduz duração e desativa rolagem animada globalmente. A inspeção visual final nos dois temas permanece uma etapa distinta da compilação.


## Cadastros no contexto — versão 3.2

Cadastros de fornecedores usam o **Sheet publicado do TrinketOS**, pela camada `@store-flow/ui`. Abrir pela direita no desktop e ocupar a largura disponível no mobile, mantendo a listagem montada, seus filtros, seleção e página. Cabeçalho fixo, corpo com rolagem própria e ações de formulário ao alcance. A superfície de fundo permanece legível, com escurecimento discreto e sem blur.

Novo fornecedor e edição usam o painel. Gestão de contatos pode ser acessada diretamente pela linha ou como uma seção interna do mesmo painel, com “Voltar ao fornecedor”, preservando os campos digitados. Evitar empilhar Sheets para subcadastros. Exclusão usa `ConfirmDialog`, com o nome do fornecedor carregado antes da confirmação. Confirmar descarte de rascunhos e impedir fechamento durante gravações; foco, Escape e Tab usam o comportamento dos componentes publicados.

Links antigos de cadastro, edição, contatos e exclusão continuam válidos e redirecionam à listagem com a ação correspondente. Cliques normais abrem no contexto; abrir em outra aba mantém um endereço funcional. Pedidos de compra são fluxos próprios e continuam com navegação própria nesta etapa. URLs e caches preservam o contexto de filial; não alterar o escopo autorizado da API para tornar o painel conveniente.

O Storybook inclui o exemplo **Store Flow / Manual da marca / Cadastro lateral**, explicitamente ilustrativo. A compilação e os testes de rotas não substituem a inspeção visual, de foco e responsividade no navegador.
