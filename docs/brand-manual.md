---
tipo: manual-de-marca
marca: Store Flow
conceito: Clareza para operar
versao: 5.0.0
atualizado: 2026-10-28
status: direcao-fornecida-com-implementacao-em-validacao
---

# Store Flow — manual de identidade e interface

Fonte vigente. A versão 5 incorpora as 15 referências fornecidas pelo responsável em 28/10/2026 e substitui a direção de cantos retos e azul sóbrio da [versão 4.2](history/brand-manual-4.2.md). Mantém a estrutura do [padrão no Obsidian](D:/Obsidian/conteudo/branding/padrao-manual-de-marca.md) e seu [template](D:/Obsidian/conteudo/branding/templates/manual-de-marca.md), consultados anteriormente.

## Metadados e proveniência

Requisito fornecido: interface limpa, condensada, adequada à gestão de lojas e reformulada conforme as imagens. Consulte o [catálogo](design-references/retail-dashboard-2026-10-28/README.md), a [galeria de 19 pranchas públicas originais](design-references/retail-dashboard-2026-10-28/gallery.html) e o [manifesto com hashes](design-references/retail-dashboard-2026-10-28/manifest.json). Os anexos são recortes/versões redimensionadas; seus binários exatos não estão disponíveis. A origem é Sprinta, da Opedia Studio / Samsun Nahar.

Base técnica: `@trinketos/ui@0.2.0`, adaptado por `@store-flow/ui`, conforme autorização do responsável. [Registro da migração](ui-migration.md). Requisito fornecido, implementação proposta e validação visual são estados distintos; compilação não representa aprovação visual.

## 1. Conceito, personalidade e público

**Clareza para operar.** Localizar registros, comparar informações, cadastrar, vender e acompanhar resultados. Pilares: clareza, ritmo, rastreabilidade e contexto. Expressão direta, leve e profissional. O produto contém gestão da plataforma e operação por empresa/filial. Não pressupor perfis demográficos não pesquisados.

## 2. Relação de marcas e herança

Store Flow é a plataforma; empresa é o negócio; filial é o contexto operacional. TrinketOS fornece componentes e comportamento técnico. Sprinta orienta composição, cores e formas; não transfere seu símbolo, fotografias ou marcas de pagamento ao Store Flow. Logos de clientes não alteram estados, foco ou autorização.

## 3. Logo e assets

Preservar [logo-square.png](../apps/backoffice/public/logo-square.png) e [logo-icon-square.png](../apps/backoffice/public/logo-icon-square.png), PNGs de 1254 × 1254, e o [ícone existente](../apps/backoffice/app/icon.svg). A aplicação é centralizada em [BrandMark](../apps/backoffice/src/shared/ui/brand-mark.tsx). Escrever **Store Flow**. Preservar proporções, sem efeitos ou recoloração. Trilho: símbolo com nome acessível; navegação expandida: assinatura e contexto. Master vetorial identificado, variantes oficiais, direitos, área de proteção e tamanho mínimo continuam pendentes. O símbolo da referência não substitui o existente.

## 4. Fundamentos da paleta

| Primitivo | Valor | Aplicação |
| --- | --- | --- |
| Azul da referência | `#3282DE` | Marca e séries gráficas |
| Azul de ação | `#2874C8` | Botões e indicador principal com texto branco |
| Branco | `#FFFFFF` | Área de trabalho |
| Escuro | `#262626` | Texto principal |
| Cinza da referência | `#F5F5F5` | Base de superfícies suaves |
| Painel implementado | `#F8F9FA` | Cards e regiões |
| Menta / rosa / creme | `#EDFBF6` / `#FCF2FA` / `#FFFBED` | Indicadores secundários |

Branco sobre `#3282DE` tem contraste aproximado de 3,90:1; a derivação de ação `#2874C8`, de 4,75:1. Texto normal em botões usa a derivação. Nas telas, consumir tokens semânticos.

## 5. Tokens semânticos e temas

Fonte executável: [colors.css](../packages/ui/src/tokens/colors.css). Ordem: tema publicado → tokens Store Flow → aplicação.

| Token | Claro | Escuro |
| --- | --- | --- |
| background / foreground | `#FFFFFF` / `#262626` | `#111820` / `#EDF1F5` |
| card | `#F8F9FA` | `#19232E` |
| primary / primary-foreground | `#2874C8` / branco | `#9BC9FA` / `#102337` |
| muted-foreground | `#5B6573` | `#B0BDCB` |
| accent / accent-foreground | `#DFF0FC` / `#1E5B94` | `#254560` / `#DEEFFF` |
| border / input | `#E4E8ED` / `#8090A4` | `#344455` / `#708298` |

Estados possuem pares próprios de superfície/texto e rótulo explícito. Bordas suaves não são o único sinal de interação. O tema escuro é adaptação implementada, pois não aparece nas referências; requer revisão visual própria.

## 6. Tipografia e escala

Hellix é a família indicada na prancha, de Light a Bold. **Nenhum arquivo Hellix ou licença distribuível foi incorporado.** A declaração usa Hellix com fallback Inter, carregada no aplicativo; Inter é a fonte efetiva enquanto Hellix não estiver disponível. Não renomear outra fonte para simular sua presença.

Texto operacional: 14 px; metadados: 12 px; título de página: 26 px médio; região: 16–18 px; indicador: 28 px semibold. A escala editorial 56/32/20 px da prancha não obriga títulos operacionais de 56 px. Valores financeiros usam números tabulares; códigos podem ser monoespaçados. Condensar espaços, sem comprimir caracteres.

## 7. Composição, iconografia e imagens

Área branca, módulos cinza claro, sombras mínimas e fundos suaves. Cards: raio 24 px; base: 16 px; pílulas/controles: 999 px; detalhes: 8 px. Linhas de tabela com extremos arredondados. Fonte: [radius.css](../packages/ui/src/tokens/radius.css).

Desktop: trilho 88 px, cabeçalho 80 px, margens 24 px e intervalos 20 px. Mobile: cabeçalho 68 px, margens/intervalos 16 px e menu em Drawer. Grade fluida de até 12 colunas, reduzida para 4; medidas 85/76 px da referência são ilustrativas. Controles: 40 px, ou 44 px em ponteiro de toque; linhas: 52/56 px. Fonte: [layout.css](../packages/ui/src/tokens/layout.css).

Ícones funcionais consistentes, nomes acessíveis e tooltip no trilho. Miniaturas vêm dos cadastros reais; ausência de imagem mostra símbolo neutro. Não preencher produtos com fotografias da referência.

## 8. Componentes, estados e padrões de página

Consumir `@store-flow/ui`; `@store-flow/ui/trinket` expõe o catálogo publicado para necessidades ainda não adaptadas. Importar apenas o utilizado.

- Navegação: trilho desktop, rota ativa azul circular, menu mobile rotulado, filial e conta identificáveis.
- Listagem: título/ação → busca/filtros → registros → paginação. Preservar filtros e seleção na URL quando suportados.
- Inventário: indicadores, tabela ou catálogo, miniaturas, saldo/status, detalhe selecionado e alertas reais. Informar quando indicadores e alertas abrangem apenas a página carregada.
- Venda: catálogo à esquerda e cliente/itens/resumo à direita em telas largas; sequência vertical no mobile. Preservar quantidades, parcelas, vencimentos e recebimentos. Selecionar meio de recebimento não implica processamento de pagamento.
- Formulários: seções arredondadas, rótulos persistentes, instruções junto ao campo e ações claras. Dialog/Sheet preservam Escape, foco e contexto.
- Indicadores: destaque azul e secundários menta/rosa/creme. Carregamento, erro e vazio têm estados próprios. Sem percentuais decorativos.
- Gráficos: semicírculos para distribuições reais; séries azul/azul claro/laranja. Curvas e crescimento exigem histórico disponível. Não inventar dados para imitar a referência.
- Feedback: mensagens breves; erros de formulário persistentes junto ao campo. Toast não substitui validação.

## 9. Voz e tom

Português brasileiro direto e útil: “Novo produto”, “Salvar”, “Revisar estoque”, “Tentar novamente”. Explicar o ocorrido e a próxima ação possível. Preservar traduções e evitar detalhes de implementação nas mensagens operacionais.

## 10. Motion

Transições breves para seleção, foco, abertura e feedback. Respeitar `prefers-reduced-motion`; não esconder valores finais ou interromper tarefas com animações.

## 11. Acessibilidade

Teclado, foco visível, nomes em botões de ícone, status com texto, cabeçalhos semânticos, rótulos associados e erros anunciados. Contraste: texto normal 4,5:1, texto grande 3:1 e indicadores essenciais 3:1. Revisar hover/disabled, transparências, portais e ambos os temas em contexto. Tabelas largas rolam dentro da região; a página se adapta ao viewport.

## 12. Aplicações por canal e papel

Plataforma: empresas, usuários, planos, auditoria e indicadores reais. Filial: catálogo, clientes, fornecedores, pedidos, estoque e caixa. Autenticação usa os mesmos tokens. Storybook apresenta dados explicitamente ilustrativos, sem confundi-los com registros do produto.

## 13. Localização e mercado

Manter pt-BR/en/es, moeda, datas, fuso e contratos existentes. A referência em inglês/dólares não altera regras financeiras ou localização do Store Flow.

## 14. Governança e histórico

Consultar este manual e a galeria antes de alterar UI. Componentes em `packages/ui`, composições no backoffice e exemplos no Storybook. Atualizar manual, tokens e exemplos conjuntamente. Documentos em `docs/history` são históricos. Preservar trabalho local fora do escopo.

## 15. Verificação e pendências

Executar tipos, lint, testes de comportamento e builds do aplicativo/Storybook. Inspeção visual deve cobrir desktop/mobile, temas, filtros, seleção, quantidades, teclado e portais. Registrar separadamente testes automatizados e observação da interface.

Pendências: arquivo/licença Hellix, masters de marca e inspeção visual da implementação no aplicativo. Referências arquivadas e compilação não encerram essas pendências.
