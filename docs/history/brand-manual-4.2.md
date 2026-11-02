---
tipo: manual-de-marca
marca: Store Flow
conceito: Clareza para operar
versao: 4.2.0
atualizado: 2026-10-28
status: direcao-existente-com-port-em-andamento
---

# Store Flow — manual de identidade e interface

Fonte de consulta vigente para identidade, interface e comportamento. Esta revisão substitui a organização cumulativa da versão 3.2 e segue a estrutura do [padrão no Obsidian](D:/Obsidian/conteudo/branding/padrao-manual-de-marca.md) e seu [template](D:/Obsidian/conteudo/branding/templates/manual-de-marca.md). O exemplo BarberFlow orienta a profundidade documental; suas cores, fontes e público não são transferidos ao Store Flow.

**Direção fornecida pelo responsável em 28/10/2026:** interface limpa e condensada, voltada à rotina de grandes sistemas de gerenciamento de loja. O trabalho diário tem prioridade: localizar registros, comparar informações, cadastrar, corrigir e acompanhar situações. A identidade permanece sóbria e azul; densidade significa aproveitar o espaço com hierarquia, sem reduzir a leitura.

### Regra rápida para implementar

1. Navegação persistente → contexto da operação → título e ação → busca/filtros → registros → paginação.
2. Uma superfície para cada listagem; filtros e resultados pertencem à mesma região.
3. Inter de 14 px para leitura, título de 22 px e números tabulares; condensar espaços, não os caracteres.
4. Poucas cores, linhas discretas, raios retos e ícones funcionais. Ações e estados são o destaque.
5. Detalhes progressivos: mostrar o necessário para decidir e abrir informações complementares por ação.

As medidas abaixo são a tradução implementada desta direção; a inspeção visual permanece pendente.

## Metadados e proveniência

| Campo | Valor, fonte e status |
| --- | --- |
| Marca e conceito | Store Flow / Clareza para operar. Direção documentada na versão 3.2, preservada. |
| Responsável | Antonio Silva, solicitante desta migração. Direção limpa, condensada e operacional fornecida explicitamente em 28/10/2026; medidas individuais continuam sujeitas à revisão visual. |
| Escopo autorizado | Completar o manual e iniciar a substituição do UI pelo TrinketOS, conforme solicitação de 28/10/2026. |
| Base documental | Padrão e template do Obsidian, versão 1.0.0, 08/10/2026. Consultados nesta revisão. |
| Base técnica | `@trinketos/ui@0.2.0`, já presente e confirmado no registro npm por `pnpm view`; README, exports e declarações do pacote instalado inspecionados. |
| Implementação | [Tokens](../packages/ui/src/tokens/), [adaptadores](../packages/ui/src/components/), [backoffice](../apps/backoffice/), [exemplos](../apps/docs/src/stories/foundations/store-flow-brand.stories.tsx). |
| Referência de produto | [Estudo de varejo e seus limites](retail-reference-study.md). Não constitui acesso a sistemas privados. |

**Status usados:** fornecido = informado pelo responsável; observado = encontrado no código ou documento; direção existente = documentado anteriormente, sem inventar nova aprovação; proposta implementada = inferência aplicada nesta revisão, ainda passível de ajuste visual; pendente = não confirmado ou não verificado. Implementação e compilação não equivalem a aprovação de marca ou inspeção visual.

## 1. Conceito, personalidade e público

**Fonte/status:** manual 3.2 e funcionalidades observadas; direção existente.

Store Flow organiza o trabalho de uma loja para que a equipe saiba onde está, o que fazer e o que aconteceu depois de uma ação. Pilares: clareza, ritmo, rastreabilidade e contexto. Expressão sóbria, próxima e direta; a tarefa aparece antes da decoração.

O aplicativo contém gestão da plataforma e operação por empresa/filial. Pequenas lojas e operações com filiais são o contexto descrito anteriormente. Demografia detalhada, abrangência comercial e uso físico em totem não foram confirmados. Não extrapolar esses públicos a partir de outros produtos do Obsidian.

## 2. Relação de marcas e herança

**Fonte/status:** manual 3.2 e pedido atual; direção existente e requisito fornecido.

Store Flow é a plataforma; a empresa é o negócio; a filial é o contexto operacional. Logos de clientes não alteram tokens de sucesso, erro, foco ou autorização. TrinketOS fornece os componentes e seu comportamento técnico. Isso não transfere automaticamente sua identidade visual, nome ou voz ao Store Flow. Herança visual de Orbit, BarberFlow ou outra marca não foi autorizada.

## 3. Logo e assets

**Fonte/status:** arquivos observados no repositório; aprovação final, autoria e direitos pendentes.

| Asset | Formato / dimensão observada | Aplicação e estado |
| --- | --- | --- |
| [Assinatura existente](../apps/backoffice/public/logo-square.png) | PNG, 1254 × 1254 px | Disponível no aplicativo; preservar proporções. |
| [Símbolo existente](../apps/backoffice/public/logo-icon-square.png) | PNG, 1254 × 1254 px | Variante disponível; reconhecimento em tamanho pequeno pendente. |
| [Ícone do aplicativo](../apps/backoffice/app/icon.svg) | SVG | Ícone existente; não tratado como arquivo mestre aprovado. |
| [Composição de marca](../apps/backoffice/src/shared/ui/brand-mark.tsx) | React | Aplicação observada no produto. |

Escrever **Store Flow**, com espaço e iniciais maiúsculas. Não distorcer, recolorir, acrescentar brilho, sombra colorida ou slogan à navegação. A versão anterior propunha assinatura de 28–32 px e respiro de 8 px: são referências de interface, não medidas oficiais do logo. Faltam master vetorial identificado, variantes monocromática/negativa, direitos e avaliação real de área de proteção/tamanho mínimo. Nenhum asset novo foi gerado nesta migração.

## 4. Fundamentos da paleta

**Fonte/status:** manual 3.2 e `colors.css`; direção existente. Os nomes abaixo documentam os fundamentos, sem criar obrigação de usar hex nas páginas.

| Primitivo documental | Valor | Papel |
| --- | --- | --- |
| Azul operacional | `#28548a` | Identidade funcional e ação no tema claro |
| Azul de leitura escura | `#8bb7ed` | Ação e foco sobre superfícies escuras |
| Neve | `#f8fafc` | Área de trabalho clara |
| Papel | `#ffffff` | Superfície clara |
| Tinta | `#172435` | Conteúdo principal claro |
| Ardósia | `#526176` | Texto de apoio claro |
| Noite | `#101820` | Área de trabalho escura |
| Painel escuro | `#17212d` | Superfície escura |

Concentrar azul em ação principal, foco e seleção. Verde, âmbar e vermelho descrevem estados com rótulo textual. Não substituir a direção azul por cores sugeridas automaticamente por uma ferramenta. A consulta UI/UX desta revisão retornou também hero promocional e paleta verde; essas sugestões não se aplicam ao backoffice e foram descartadas.

## 5. Tokens semânticos e temas

**Fonte/status:** [colors.css](../packages/ui/src/tokens/colors.css), observado; `input` ajustado nesta revisão como proposta implementada. O tema compilado do TrinketOS é importado uma vez, antes dos tokens Store Flow. Tailwind 4 expõe esses tokens por `@theme inline`; `dark` acompanha a classe do tema.

| Superfície / conteúdo | Claro | Escuro | Função |
| --- | --- | --- | --- |
| `background` / `foreground` | `#f8fafc` / `#172435` | `#101820` / `#e8edf4` | Área de trabalho e leitura |
| `card` / `card-foreground` | `#ffffff` / `#172435` | `#17212d` / `#e8edf4` | Formulários e painéis |
| `popover` / `popover-foreground` | `#ffffff` / `#172435` | `#17212d` / `#e8edf4` | Menus e seletores em portal |
| `primary` / `primary-foreground` | `#28548a` / `#ffffff` | `#8bb7ed` / `#12243b` | Ação principal |
| `secondary` / `secondary-foreground` | `#edf2f7` / `#263b55` | `#233247` / `#e8edf4` | Ação secundária |
| `muted` / `muted-foreground` | `#f0f3f7` / `#526176` | `#1d2b3a` / `#a6b3c5` | Apoio e metadados |
| `accent` / `accent-foreground` | `#e9f0f9` / `#234c7f` | `#243b56` / `#d9e8fb` | Seleção e realce |
| `destructive` / `destructive-foreground` | `#b42335` / `#ffffff` | `#ef8290` / `#300d16` | Ação destrutiva; variante do componente pode usar transparência |
| `success` / `success-foreground` | `#e6f4ed` / `#226347` | `#163d30` / `#a2dfbc` | Conclusão confirmada |
| `warning` / `warning-foreground` | `#fff1d6` / `#805600` | `#443718` / `#f5d68d` | Atenção com instrução |
| `info` / `info-foreground` | `#e8f0fb` / `#28548a` | `#213d60` / `#bfd8fa` | Informação contextual |
| `error` / `error-foreground` | `#fce8ec` / `#a42238` | `#492332` / `#fac0ca` | Erro recuperável |

| Token | Claro | Escuro | Função / estado |
| --- | --- | --- | --- |
| `border` | `#dce3ec` | `#334155` | Divisória discreta; não é o único indicador de um controle |
| `input` | `#7b8da4` | `#62758c` | Limite de campo; proposta implementada para contraste maior |
| `ring` | `#28548a` | `#8bb7ed` | Foco visível |
| `sidebar` / `sidebar-foreground` | `#ffffff` / `#526176` | `#17212d` / `#a6b3c5` | Navegação |
| `sidebar-primary` / foreground | `#28548a` / `#ffffff` | `#8bb7ed` / `#12243b` | Ação na navegação |
| `sidebar-accent` / foreground | `#e9f0f9` / `#234c7f` | `#243b56` / `#d9e8fb` | Rota selecionada |
| `sidebar-border` / `sidebar-ring` | `#dce3ec` / `#28548a` | `#334155` / `#8bb7ed` | Separação / foco |
| `radius` e escala derivada | `0rem` | `0rem` | Superfícies retas; escala sem valores negativos |

Gráficos operacionais usam papéis semânticos existentes e legendas com valor exato; não há uma paleta categórica de marca aprovada. `chart-1…n` não recebeu cores arbitrárias nesta revisão.

### Triagem de contraste em cores opacas

Medição calculada por luminância relativa em 28/10/2026. Os pares abaixo são a superfície efetiva declarada, sem transparência; não certificam os componentes renderizados.

| Par | Claro | Escuro | Critério de triagem |
| --- | --- | --- | --- |
| `foreground` sobre `background` | 14,98:1 | 15,21:1 | Texto normal ≥ 4,5:1 |
| `muted-foreground` sobre `background` | 6,03:1 | 8,42:1 | Texto normal ≥ 4,5:1 |
| `primary` sobre `card` | 7,71:1 | 7,81:1 | Texto e foco |
| `input` sobre `card` | 3,39:1 | 3,44:1 | Limite de controle ≥ 3:1 |
| `destructive` sobre `card` | 6,50:1 | 6,40:1 | Texto de erro opaco |

Hover com mistura, badges suaves, anéis transparentes, overlays e estados desabilitados precisam de verificação da composição real. `border` não deve servir como substituto de `input` quando o limite é necessário para identificar o campo.

## 6. Tipografia e escala

**Fonte/status:** Inter é direção existente; Roboto Mono já constava no token compartilhado, mas o aplicativo usava Inter como fonte secundária. Carregamento real de Roboto Mono via `next/font/google`: proposta implementada nesta revisão.

| Papel | Família | Escala / peso |
| --- | --- | --- |
| Corpo, campos, botões e tabela | Inter; fallback `ui-sans-serif, system-ui, sans-serif` | 14 px / 20–21 px, 400–500 |
| Título de página | Inter | 22 px / 28 px, 600 |
| Título de seção | Inter | 16 px / 24 px, 600 |
| Metadados e cabeçalho de tabela | Inter | 12–13 px / 16–20 px, 500 |
| Códigos técnicos e referências | Roboto Mono; fallback `ui-monospace, monospace` | 12–14 px / 20 px, 400–500 |
| Dinheiro e quantidades | Inter com números tabulares | 14 px, alinhamento à direita em tabelas |

Ambas são carregadas pelo Next com `display: swap` e subset Latin; o navegador recebe os arquivos da aplicação. Não impor mono a títulos ou valores monetários. O Storybook usa a pilha declarada e pode cair no fallback se a fonte não estiver instalada: sua equivalência tipográfica com o Next ainda requer distribuição local das fontes no catálogo. Distribuições para outros canais devem acompanhar os termos de licença dos arquivos efetivamente distribuídos; não há kit tipográfico exportado nesta entrega.

## 7. Composição, iconografia e imagens

**Fonte/status:** direção 3.2, tokens e telas observados; preservado com unificação de regras antes dispersas.

Ritmo de 4, 8, 12, 16, 24 e 32 px. Espaço entre regiões e campos: 12 px; label/campo: 6 px. Margem operacional de 16 px; formulários com 16–24 px de padding. Controles padrão de 36 px no desktop e alvos de pelo menos 44 px em ponteiro grosso. Listagens podem rolar horizontalmente dentro da região de tabela; a página não deve alargar.

| Medida de interface | Token compartilhado | Valor / aplicação |
| --- | --- | --- |
| Controle | `--sf-control-height` | 36 px; 44 px em ponteiro grosso |
| Cabeçalho de contexto | `--sf-header-height` | 56 px como mínimo, sem cortar texto ampliado |
| Navegação lateral | `--sf-sidebar-width` | 240 px; conteúdo longo quebra ou trunca com nome acessível |
| Margem de trabalho | `--sf-page-gutter` | 16 px, aproveitando a largura disponível |
| Ritmo entre regiões | `--sf-region-gap` | 12 px |
| Linha de tabela | `--sf-table-row-height` | Referência de 40 px; 44 px em toque; cresce conforme conteúdo/ações |
| Título | `--sf-page-title-size` | 22 px |

Fonte: [layout.css](../packages/ui/src/tokens/layout.css), proposta implementada nesta revisão. Sem texto cortado por altura fixa. Não impor fonte tipograficamente condensada nem diminuir o corpo para 11–12 px. Em monitores amplos, aproveitar a área para colunas e contexto útil; não esticar campos curtos ou centralizar uma coluna estreita em grandes vazios.

Superfície contínua de formulário com divisórias. Cards delimitam grupos independentes e tabelas. Não preencher espaço com altura mínima artificial, fotografia, hero, resumo lateral decorativo ou métricas sem utilidade. Uma coluna no celular e duas para campos curtos em desktop; textos longos ocupam toda a largura. Não esconder ações essenciais para caber na tela.

Phosphor é a biblioteca de ícones observada nas telas; os componentes publicados têm seus próprios ícones. Essa coexistência técnica não confirma preferência de marca por outra família. Usar ícones de 16–20 px, estilo consistente na mesma região, decorativos com `aria-hidden`; controles sem texto precisam de nome acessível. Fotografias de produto pertencem ao cadastro; fotos promocionais não foram definidas. Direitos, cortes e usos institucionais de imagens permanecem pendentes.

## 8. Componentes, estados e padrões de página

**Fonte/status:** requisito de migração fornecido, contratos publicados inspecionados e implementação desta revisão. Estado detalhado e limites: [migração de UI](ui-migration.md).

`@store-flow/ui` é a camada de identidade e compatibilidade, não uma segunda biblioteca de primitivos. Reutilizar o componente publicado e adaptar somente densidade, tokens, nomenclatura e contratos necessários. O catálogo integral também está disponível em `@store-flow/ui/trinket`; importar apenas o que for usado. Disponibilidade do catálogo não significa que todas as telas foram migradas.

| Família | Comportamento e expressão |
| --- | --- |
| Botão | Uma ação primária por contexto; secundárias com menor ênfase. `type="submit"` explícito para salvar. Aguardar resposta e impedir envio repetido. |
| Campo / textarea | Label associado; ajuda antes do erro; estado inválido e mensagem específica; não depender de placeholder como label. |
| Seleção | Select publicado preserva `name`, `required`, valor, formulário e teclado; switch/radio adaptam callbacks para a API anterior. |
| Abas | Estado controlado para URLs existentes; setas/Home/End e painéis associados vêm do pacote. Abas não podem provocar submissão. |
| Badge | Texto de situação obrigatório; cores são semânticas. Hover não pode ser a única forma de descobrir o estado. |
| Diálogo | Conteúdo/portal/foco do pacote; largura padrão ou ampla; X com label localizado; impedir fechamento enquanto salva no controlador do formulário. |
| Sheet | Cadastro no contexto da listagem; largura disponível no celular e painel à direita no desktop; preservar filtros e rolagem. |
| Estado vazio | Explicar ausência e próxima ação; usar componentes Empty publicados. Não inventar dados para preencher a tela. |
| Progresso / OTP | Progresso com semântica publicada. OTP real aceita colagem e teclado; slots ilustrativos soltos não substituem um campo funcional. |
| Paginação | A listagem administrativa usa o componente publicado com total e página da API, rótulos em português e controles desabilitados nos limites. |

Todos os controles precisam de default, hover/focus quando interativos, pressed quando pertinente, loading e disabled. Erro e sucesso pertencem ao fluxo e são anunciados por alert/status; uma cor sozinha não confirma gravação. Avatar, tooltip, breadcrumb, listas, paginação, máscaras e DataTable usam a API publicada; Drawer compõe o Sheet e Alert compõe o Banner. Menus usam os componentes publicados com compatibilidade Radix limitada aos contratos ainda ausentes. Calendário, sidebar e toggle continuam composições Store Flow sobre Button publicado. Limites detalhados no inventário.

| Página | Estrutura |
| --- | --- |
| Listagem | Título e ação → busca/filtros → tabela → paginação |
| Cadastro/edição | Contexto quando necessário → título → seções planas de campos → salvar/cancelar |
| Detalhe | Identificação/situação → dados → histórico relacionado |
| Visão geral | Indicadores comprováveis, pendências acionáveis e acessos úteis |
| Configurações | Assuntos e permissões separados → salvar explícito |

`PageHeader` usa título de 22 px e ações que quebram de linha no celular. `PageLayout` usa gap de 12 px. `PageSection`, `PageToolbar` e `FormActions` são composições Store Flow. Tabelas: 14 px, cabeçalho 12–13 px, números tabulares e referência de 40 px por linha em desktop, sem limitar a altura do conteúdo. `StatCard` é a referência para indicadores, com valor de 24 px e padding de 12 px; a grade operacional existente de cinco indicadores mantém distribuição uniforme em desktop amplo, sem impor cinco cards a toda página.

### Layout de gerenciamento de loja

O shell apresenta navegação por módulos à esquerda e a área de trabalho à direita. Contexto de empresa/filial permanece na navegação ou na barra de contexto, sem repetir marca, filial e slogans no conteúdo. A gestão SaaS identifica a administração da plataforma, mantendo essa distinção em relação à operação da loja.

A listagem é a unidade principal: filtro visível e identificado, quantidade de resultados discreta, cabeçalho de colunas, registros e paginação no mesmo conjunto. Priorizar identificação, situação, quantidades, valores e ação pertinente. Valores alinham à direita; descrições longas podem quebrar. Não implementar seleção em massa, edição ou exportação sem suporte funcional: quando existirem, as ações aparecem a partir da seleção e respeitam permissões.

Aplicações atuais deste padrão: empresas, usuários, planos e auditoria administrativa. Planos usa tabela de comparação operacional, mantendo preço como dado cadastral. Filtros avançados e detalhes de auditoria permanecem progressivos. Durante uma requisição de página, os controles de navegação ficam desabilitados e a região dos registros expõe estado ocupado. Carregamento dentro da listagem não cria uma segunda superfície independente.

Formulários agrupam identificação, dados comerciais e condições operacionais em seções planas. O título deve descrever o cadastro, não conter uma introdução promocional. Salvar/cancelar ficam previsíveis; detalhes e histórico não competem com o preenchimento. Na navegação móvel, usar Drawer/Sheet publicado com fechamento explícito e foco gerenciado.

Sidebar: identidade e seletor de filial no topo, conta no rodapé, links de largura inteira e grupo da rota aberto; expansão em modo single sem altura fixa. Espaçamentos: 4 px entre links, 4 px após título e 8 px após grupo aberto. Menus de conta preservam links reais, abrir em nova aba e teclado. Não eliminar esses contratos para forçar uma equivalência visual.

Fornecedores mantêm cadastro/edição/contatos em Sheet; exclusão em confirmação publicada. Proteger rascunhos, impedir fechamento durante gravação e preservar links antigos que abrem a ação na listagem. Pedidos de compra seguem seu fluxo próprio. Caixa e conta do cliente exigem especificação funcional própria quando implementados; este manual não cria módulos ou regras financeiras.

## 9. Voz e tom

**Fonte/status:** direção existente, revisada por consistência.

Verbos concretos: “Novo cliente”, “Cadastrar produto”, “Salvar alterações”, “Filial ativa”. Evitar “workspace”, “pulse”, “lifetime”, slogans e texto corporativo em tarefas operacionais. Mostrar onde o usuário está e o resultado confirmado de sua ação.

| Situação | Exemplo |
| --- | --- |
| Vazio | “Nenhum fornecedor encontrado. Ajuste os filtros ou cadastre um fornecedor.” |
| Campo inválido | “Informe um preço com até duas casas decimais.” |
| Falha | “Não foi possível salvar. Revise os campos e tente novamente.” |
| Conclusão | “Alterações salvas.”, somente após confirmação da API |

Erros podem incluir referência de suporte copiável; nunca stack trace. Distinguir pedido de compra e venda, quantidade, custo, preço e saldo. Ausência de dado não é zero financeiro. Status atrasado exige regra de vencimento e saldo; vermelho não implementa uma regra de negócio.

## 10. Motion

**Fonte/status:** [motion.css](../packages/ui/src/tokens/motion.css) observado; parâmetros existentes preservados. Componentes publicados também incluem timings internos; alinhamento completo permanece pendente.

| Papel | Token / duração | Uso |
| --- | --- | --- |
| Resposta imediata | instant 80 ms / fast 120 ms | Hover e pequenos estados |
| Mudança de estado | base 180 ms | Cor e feedback |
| Entrada | enter 220 ms | Expansão e conteúdo |
| Painel | overlay 260 ms | Sheet e drawer |
| Progresso | progress 300 ms | Atualização de valor |
| Gráfico | eixo 180 ms / série 560 ms / ênfase 720 ms | Somente quando ajuda a leitura |

Easing produtivo `cubic-bezier(0.2, 0, 0, 1)`; entrada/saída e desenho têm tokens próprios no arquivo. Não criar animações decorativas contínuas. Interações durante transição devem atualizar o estado corrente, sem fila de animações. Uma nova seleção cancela a intenção anterior; não atrasar foco ou requisição até o fim de um efeito.

`prefers-reduced-motion` reduz duração a 1 ms, remove atrasos/repetição e desativa rolagem suave. O estado final e sua mensagem permanecem disponíveis sem animação. O indicador publicado faz contagem animada: validar legibilidade e correspondência com o valor final, sem tratar quadros intermediários como dados persistidos.

## 11. Acessibilidade

**Fonte/status:** referência [WCAG 2.2, W3C](https://www.w3.org/TR/WCAG22/); objetivo de revisão, sem declaração de conformidade.

Texto normal: contraste de pelo menos 4,5:1; texto grande e elementos não textuais pertinentes: 3:1. Avaliar sempre a superfície composta. A meta de conforto para toque é 44 px; o mínimo AA de tamanho de alvo da WCAG 2.2 é 24 × 24 CSS px, com suas exceções — não confundir as duas medidas.

Teclado: ordem coerente, foco visível e não encoberto, retorno ao gatilho em modais e nenhuma armadilha fora do modal. Labels e erros são associados ao controle; status anunciado sem exigir mudança de foco. Cor nunca é a única indicação de erro/seleção. Não bloquear colagem em autenticação. Verificar zoom de 200%, reflow a 320 CSS px, espaçamento de texto e movimento reduzido.

Triagem de hex, compilação, testes de servidor e semântica estática não substituem teclado, leitor de tela e inspeção no navegador.

## 12. Aplicações por canal e papel

**Fonte/status:** rotas e papéis observados no aplicativo; inspeção estática.

| Contexto | Prioridade de interface |
| --- | --- |
| Gestão SaaS / SUPER_ADMIN | Empresas, planos, usuários, auditoria e controles da plataforma; sem seletor de loja obrigatório para administrar a plataforma |
| Operação / papéis autorizados | Contexto de empresa/filial, cadastros e operações permitidas pela API |
| Autenticação / onboarding | Uma etapa clara, campos legíveis e controles de pelo menos 44 px |
| Mobile web | Uma coluna, navegação acessível e ações que quebram de linha sem sobrepor conteúdo |
| Storybook | Exemplos identificados como ilustrativos; estados claros/escuros e comparações de componentes |

Não misturar preferências pessoais com controles globais. Marca, layout e seleção de filial não ampliam autorização. Impressos, redes sociais, e-mail institucional, hardware de caixa e totem não têm aplicações de marca aprovadas nesta documentação.

## 13. Localização e mercado

**Fonte/status:** arquivos `pt-BR`, `en`, `es` e configuração regional observados. Isso demonstra suporte técnico, não confirma países de comercialização.

A experiência administrativa atual usa português e valores BRL com duas casas decimais. Usar idioma da sessão, expansão de texto e formatação regional nos fluxos internacionalizados. Datas devem explicitar fuso/horário quando ambíguas; não presumir um único fuso para todos os clientes. Códigos e referências técnicas permanecem copiáveis.

`CurrencyInput` compõe o Input publicado com slot `prefix` “R$”, decorativo para leitor de tela; o label identifica grandeza/moeda. Valores transacionais viajam em centavos inteiros no contrato existente. A migração visual não altera cálculos, impostos, vencimentos ou formato da API.

## 14. Governança e histórico

**Fonte/status:** padrão documental do Obsidian e escopo fornecido; proposta de manutenção aplicada.

Consultar esta versão antes de alterar interface ou copy. Mudanças materiais devem registrar fonte, status, impacto em tokens, assets, componentes, textos e temas, e atualizar o Storybook na mesma entrega. Identificar o responsável por aprovações futuras; não inferir aprovação a partir de código ou instalação de pacote. Publicação de site, pacote ou assets não integra esta migração.

| Versão | Data | Alteração |
| --- | --- | --- |
| 3.2 | 27/10/2026 | Direção azul, densidade operacional e cadastro lateral de fornecedores |
| 4.0.0 | 28/10/2026 | Estrutura alinhada ao Obsidian, fontes/status, catálogo de assets/tokens, triagem de contraste, tipografia e avanço dos adaptadores TrinketOS |
| 4.1.0 | 28/10/2026 | Expansão de @store-flow/ui com navegação, máscaras, Banner/DataTable, Drawer via Sheet; instalação direta no backoffice e remoção de dependências Radix sem uso |
| 4.2.0 | 28/10/2026 | Direção limpa e condensada fornecida pelo responsável; tokens de densidade, cabeçalhos e tabelas compactos, listagem integrada e navegação móvel publicada |

O pacote permanece fixado em 0.2.0. Ele declara React 18.2, enquanto o aplicativo usa React 19; não houve downgrade nem alteração de peerDependencies para esconder a diferença. Builds e testes desta revisão dão evidência limitada; interação real ainda precisa ser verificada.

## 15. Verificação e pendências

Evidências técnicas e inventário atualizado em [ui-migration.md](ui-migration.md). O manual não transforma recomendação estética em aprovação.

- [x] Padrão e template do Obsidian consultados, com links reais.
- [x] Cores primitivas separadas de papéis e estados; temas documentados.
- [x] Assets existentes catalogados; direitos e master permanecem explícitos como pendências.
- [x] Catálogo publicado acessível e novas famílias migradas por adaptação.
- [x] Contraste opaco de pares selecionados calculado; sem alegação de conformidade global.
- [ ] Revisão visual final de Inter/Roboto Mono, densidade, campos e portais pelo responsável.
- [ ] Inspeção renderizada em 375, 768, 1024 e 1440 px, nos dois temas.
- [ ] Teclado, foco, leitor de tela, zoom e movimento reduzido em execução real. Host de navegador indisponível nesta sessão.
- [ ] Resolver contratos das famílias ainda locais antes de declarar migração integral.
- [ ] Confirmar direitos, versões oficiais do logo, distribuição tipográfica do Storybook e aplicações fora do produto.
