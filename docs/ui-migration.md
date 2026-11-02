# Migração do backoffice para TrinketOS UI

Atualizado em 28/10/2026. Direção visual vigente: [manual de marca 5.0.0](brand-manual.md).

## Contrato de consumo

`@trinketos/ui@0.2.0` já era uma dependência de `packages/ui`; sua presença não demonstrava migração integral. A versão publicada foi confirmada por `pnpm view @trinketos/ui version peerDependencies`, além do README e das declarações distribuídas no pacote. A página npm bloqueou a consulta web com HTTP 403; o registro npm respondeu pelo pnpm.

Na continuação, a mesma versão foi instalada explicitamente em `apps/backoffice`, com atualização do lockfile. `@store-flow/ui` continua sendo a camada de adaptação da marca, conforme confirmado pelo responsável; o manifesto do aplicativo mantém as duas dependências com finalidades distintas.

Preferir os adaptadores de marca:

```tsx
import { Button, Input, Select, Tabs, Dialog } from "@store-flow/ui";
```

O catálogo completo publicado foi disponibilizado sem duplicar os componentes nem criar instâncias artificiais nas páginas:

```tsx
import { Field, Skeleton, SearchField } from "@store-flow/ui/trinket";
```

Importar somente os componentes utilizados. O subpath é acesso ao catálogo, não garantia de adaptação de cada API à marca. Tema publicado compilado → tokens Store Flow → regras da aplicação. Não copiar CSS interno do pacote para manter uma implementação paralela. Não instalar uma segunda versão do React para satisfazer os peers.

## Inventário verificável

| Família | Origem atual | Estado nesta revisão |
| --- | --- | --- |
| Accordion | `@trinketos/ui/accordion` | Já consumido anteriormente |
| Button | `@trinketos/ui/button` | Já adaptado; densidade e toque Store Flow |
| Card | `@trinketos/ui/card` | Já adaptado |
| Checkbox | `@trinketos/ui/checkbox` | Já consumido |
| Input / CurrencyInput | `@trinketos/ui/input` | Já adaptado; prefixo de moeda por slot |
| Label | `@trinketos/ui/label` | Já consumido |
| Table | `@trinketos/ui/table` | Já consumido |
| PageHeader | `@trinketos/ui/page-header` | Já adaptado |
| Sheet | `@trinketos/ui/sheet` | Já adaptado no cadastro de fornecedores |
| StatCard | `@trinketos/ui/stat-card` | Já adaptado; agora aplicado também aos quatro indicadores da gestão SaaS |
| Badge | `@trinketos/ui/badge` | Implementação local substituída |
| Select | `@trinketos/ui/select` | Implementação Radix local substituída; Root mapeado ao nome anterior e trigger com densidade compartilhada de 40/44 px |
| Textarea | `@trinketos/ui/textarea` | `TextArea` publicado adaptado; ref e atributos de formulário preservados |
| Tabs | `@trinketos/ui/tabs` | Root publicado com adaptação `onChange` → `onValueChange` e estado não controlado para os exemplos |
| Switch | `@trinketos/ui/switch` | Input nativo publicado; `onCheckedChange` adaptado sem perder `onChange` |
| RadioGroup / RadioGroupItem | `@trinketos/ui/radio` | Grupo e Radio publicados; callback por valor adaptado |
| Progress | `@trinketos/ui/progress` | Progresso publicado com informação visual opcional oculta por padrão |
| Dialog | `@trinketos/ui/dialog` | Conteúdo, portal, overlay e foco publicados; largura, título, padding e X localizado adaptados |
| EmptyState | `@trinketos/ui/empty` | Composição de Empty/Content/Media/Title/Description publicados |
| IconButton | `@trinketos/ui/icon-button` | Slot `icon` adaptado ao contrato anterior com children; label obrigatório |
| InputOTP | `@trinketos/ui/input-otp` | Root e slots publicados; exemplos agora são campos editáveis reais |
| Paginação | `@trinketos/ui/pagination` | Componente genérico legado removido; ListPagination e Storybook usam a mesma API publicada |
| DropdownMenu | Publicado + compatibilidade limitada | Root, Trigger, grupos, submenus, seleção, separadores e itens simples publicados. Item/Content conservam fallback Radix apenas para contratos não expostos pelo pacote |
| Avatar | `@trinketos/ui/avatar` | Telas e exemplos migrados para src/initials; variantes Image/Fallback locais removidas |
| Tooltip | `@trinketos/ui/tooltip` | Componente publicado assume seu provider; exemplo migrado para title/placement |
| Breadcrumb / List | `@trinketos/ui/breadcrumb`, `@trinketos/ui/list` | APIs antigas removidas; breadcrumbs de fornecedores/produtos preservam links Next e callback de retorno |
| Drawer | `@trinketos/ui/sheet` | Composição publicada nas quatro direções, mantendo botão de fechar explícito e aparência Store Flow |
| Sidebar | Composição Store Flow + Button publicado | Estrutura de navegação própria; itens agora usam Button/asChild, sem Slot ou botão local |
| Alert | `@trinketos/ui/banner` | Banner publicado com adaptação de variant, conteúdo e role alert/status |
| Calendário / toggle | Composições Store Flow + Button publicado | Não há Calendar/ToggleButton equivalente no pacote 0.2.0; botões nativos locais substituídos por Button |
| DataTable | `@trinketos/ui/data-table` | Wrapper de divs removido; exemplo usa data/columns, seleção e busca reais sobre registros ilustrativos |
| Gráficos / DistributionChart | Local/Visx | Pendentes: APIs e semântica de dados precisam de avaliação; não trocar contagens por dados ilustrativos |
| PageLayout / PageToolbar / PageSection / FormActions | Composições Store Flow | Permanecem como organização de produto sobre os primitivos publicados |
| MaskedInput | `@trinketos/ui/masked-input` | Wrapper da aplicação traduz máscaras string/array e preserva onValueChange com valor formatado; opções estabilizadas entre renders |

O inventário distingue catálogo disponível de telas migradas. Esta é uma etapa concreta do port; não é uma declaração de substituição integral.

### Limites de compatibilidade dos menus

O Item publicado não oferece `asChild`, `onSelect` cancelável ou metadados nativos completos; Content não repassa `side`/`collisionPadding`. Os adaptadores mantêm o Radix somente nesses casos para preservar links reais, abrir em nova aba, cancelamento de logout e menus laterais. Não simulam clique, não descartam eventos e não passam props que o pacote ignora. A instância de Radix usada pelo adaptador de menu foi comparada à do pacote e resolve para o mesmo módulo instalado.

Diálogos e drawers agora usam portal/overlay exportados pelo próprio TrinketOS, evitando misturar o contexto de Dialog 1.1 local com o Dialog 1.3 do pacote. Foram removidas 11 dependências Radix diretas sem consumidores da camada UI. O único Radix direto restante é dropdown-menu, pelos contratos descritos acima.

## Aplicações alteradas

Os adaptadores compartilhados atualizam os consumidores existentes de formulários, status e detalhes sem reimplementar regras de negócio. Abas da visão geral e detalhe de empresa continuam ligadas aos parâmetros de URL. Listagens administrativas passam a usar a paginação publicada. A visão geral usa StatCard nos indicadores existentes e preserva os totais da API.

Inter permanece a tipografia funcional. Roboto Mono agora é carregada de fato para códigos e referências; o aplicativo antes apontava a fonte secundária para Inter. Tokens `input` mudaram para `#7b8da4` / `#62758c` após triagem de contraste. Raios derivados não ficam negativos quando o raio-base é zero. Foco ganha contorno opaco comum aos controles. A variante dark do Tailwind acompanha a classe `.dark`.

Storybook inclui **Store Flow / Manual da marca / Componentes migrados**, exemplos de OTP funcionais e seletor global de tema que afeta o documento inteiro, incluindo portais. O seletor antigo de fundo não ativava o tema escuro dos componentes.

### Direção operacional condensada — manual 4.2

Por solicitação do responsável, a interface segue a rotina de grandes sistemas de gerenciamento de loja: navegação persistente, contexto operacional discreto, cabeçalho compacto e registros como conteúdo central. `layout.css` concentra medidas de controle (36 px desktop/44 px toque), cabeçalho (mínimo 56 px), navegação lateral (240 px), margem (16 px), ritmo (12 px), linha de tabela (referência 40/44 px) e título (22 px). Tipografia de leitura permanece em 14 px; essas medidas não fixam a altura de conteúdo longo.

Button, Input, Select, máscara, PageHeader, Sidebar, Table e DataTable usam a densidade compartilhada. Indicadores têm valor de 24 px e padding de 12 px. O shell administrativo reduz a barra superior e elimina a repetição do nome da plataforma no contexto. A listagem de empresas reúne filtros, quantidade encontrada, registros e paginação numa única superfície.

A navegação móvel operacional usa Drawer/Sheet publicado, com nome de diálogo traduzido, estado expandido, fechamento explícito e retorno ao botão de abertura. Ao alcançar o breakpoint desktop, fecha o painel para não manter um modal oculto bloqueando a página.

A aplicação do padrão continua nas listagens administrativas de usuários, planos e auditoria: toolbar, resultados e paginação ficam no mesmo Card, com rolagem horizontal apenas na região de registros. A tela de usuários mantém a busca com debounce e os fluxos de edição/promoção. Planos passa de uma grade de cards para tabela com nome/descrição, situação, preço cadastral, módulos e edição; preço ausente não vira zero, e catálogo indisponível não é apresentado como zero módulos. Auditoria conserva filtros avançados, escopo do registro e expansão das alterações. Todas essas telas usam a paginação publicada compartilhada, bloqueada enquanto sua requisição está em andamento. Estados de carregamento internos usam a opção inline para evitar um Card dentro de outro.

O Storybook inclui **Store Flow / Manual da marca / Gerenciamento de loja**: exemplo ilustrativo com busca por produto/código, filtro de situação, paginação e abertura de cadastro sem persistência. Não representa uma nova tela de produção nem adiciona regras de estoque. As checagens técnicas não equivalem à inspeção renderizada.

Verificação da densidade: suíte existente com 58 testes aprovada, typechecks de UI/backoffice/documentação aprovados, lint aprovado e builds finais do backoffice e Storybook concluídos. Os tokens de 40/44 px e seu consumo real em controles, títulos, sidebar e linhas de tabela foram conferidos no CSS de produção do Storybook; os três arquivos de idioma são JSON válido. Não foram criados testes que apenas repetem as classes ou medidas da implementação.

Verificação da aplicação às listagens administrativas: 59 testes passaram, incluindo regressão de paginação bloqueada durante consulta; typecheck, lint e build de produção do backoffice aprovados. Não houve alteração da API, de permissões ou dos contratos de gravação. A descoberta de navegador continuou retornando host indisponível; esta etapa não recebeu homologação visual.

## Compatibilidade e verificação

O pacote declara React/React DOM `^18.2.0`; o aplicativo usa React 19. Essa incompatibilidade de peer permanece explícita. O pacote não foi atualizado, os peers não foram reescritos e React não foi rebaixado.

Testes novos verificam semântica renderizada e contratos relevantes: valores iniciais de formulário, radio selecionado, painel ativo de abas, nome/tipo do botão de ícone, limites da paginação vazia e seis inputs reais do OTP. O teste anterior de abas passou a contar `role="tabpanel"`, em vez de depender do atributo interno `data-state` da implementação Radix anterior. Não se trata de teste de teclado em navegador.

Comandos de verificação desta revisão:

```text
pnpm --filter @store-flow/ui typecheck
pnpm --filter @store-flow/backoffice typecheck
pnpm --filter @store-flow/docs typecheck
pnpm test:backoffice
pnpm --filter @store-flow/backoffice lint
pnpm --filter @store-flow/backoffice build
pnpm --filter @store-flow/docs build
```

Primeira etapa em 28/10/2026: 52 testes passaram. Na continuação, os 58 testes passaram, incluindo breadcrumbs reais, listas semânticas, role de Banner, valores de máscaras e controles da sidebar. Typechecks de UI, backoffice e documentação, lint do backoffice e builds de produção do backoffice e do Storybook passaram. O Storybook mantém o aviso de chunks acima de 500 kB; desempenho em execução não foi medido. `pnpm --filter @store-flow/backoffice list @trinketos/ui --depth 0` confirmou a dependência direta 0.2.0 instalada.

Inspeção visual, teclado/foco, responsividade, zoom, leitor de tela e reduced motion continuam pendentes: a descoberta de superfícies nesta sessão retornou `The browser access host is unavailable` e pipe nativo indisponível. Não há screenshots nem alegação de homologação visual.

## Reformulacao visual com referencias preservadas

Manual 5 e galeria em docs/design-references/retail-dashboard-2026-10-28. Foram arquivadas 19 pranchas publicas de origem, sem alteracoes, com SHA-256. A nova camada visual aplica cores suaves, raio 24 px, controles em pilula e trilho desktop 88 px. Inventario ganhou tabela/catalogo, miniaturas e contexto selecionado; a venda ganhou catalogo e resumo lateral. Navegacao, formularios, tabelas e indicadores compartilham os novos tokens. Contratos financeiros e dados reais permanecem como fonte do produto. Hellix continua uma referencia sem arquivo incorporado; Inter e o fallback distribuido. Inspecao visual do aplicativo permanece pendente.

### Validação desta reformulação — 28/10/2026

- Tipos: UI, backoffice e Storybook aprovados.
- Lint do backoffice aprovado; 59 testes de comportamento aprovados.
- Build de produção do Next e build do Storybook aprovadas. Storybook emite aviso de tamanho de chunks.
- Integridade dos 19 JPEGs verificada por leitura de imagem e SHA-256; 42,7 MiB arquivados.
- Inspeção visual no aplicativo pendente: o navegador de automação estava indisponível nesta sessão. Não confundir essa pendência com as verificações automatizadas concluídas.
