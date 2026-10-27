# Store Flow Backoffice — decisões de interface

Skill aplicada: `ui-ux-pro-max`, instalada a partir de
`nextlevelbuilder/ui-ux-pro-max-skill`.

A consulta `enterprise dashboard minimal --design-system` retornou
Minimalism & Swiss Style, adequado a dashboards empresariais. O padrão de
landing page sugerido pelo gerador não se aplica ao produto e foi descartado.
Preservamos os tokens Nitro, o azul da marca e a fonte Space Grotesk existentes.

## Regras comuns a todas as telas

- Superfícies discretas, hierarquia clara e espaçamento consistente.
- Navegação estável com página atual indicada e link para pular ao conteúdo.
- Controles com área de interação de pelo menos 44px de altura, foco visível
  na cor primária e rótulos associados aos campos.
- Cadastros e edição em diálogos acessíveis com cancelamento, foco controlado
  e rolagem dentro do limite de 90dvh.
- Feedback de carregamento, erros com tentativa novamente e confirmação de sucesso.
- Confirmação antes de suspensão, promoção a SUPER_ADMIN e alterações globais.
- Estados descritos em texto; cor nunca é a única informação.
- Mesmas cores semânticas para temas claro e escuro; movimento reduzido respeitado.
- Tabelas rolam dentro do próprio contêiner; grids adaptam colunas por breakpoint.

## Planos e controles

Planos mostram módulos e funcionalidades em grupos. O editor empresarial usa
três estados: herdar, permitir, bloquear. O resultado exibido considera módulo,
funcionalidade e kill switches. A confirmação global descreve o alcance nas
empresas e exige motivo para o histórico.

Verificações de código, build e HTTP foram executadas. A sessão não disponibilizou
navegador para inspeção visual em 375px/768px/1024px/1440px; essa verificação
continua pendente e não é presumida pelos testes de código.

## Identidade e estrutura do backoffice

- Detalhe empresarial com Tabs do DS: Conta, Filiais, Usuários, Plano e Histórico.
- Auditoria com filtros rotulados, paginação e detalhes expansíveis por evento.

- Fonte de verdade: DS Nitro em `apps/docs` e componentes de `packages/ui`.
- Bordas retas (`rounded-none`) em cards, controles, indicadores e diálogos.
- Sidebar: marca, grupos Operação / Produto / Plataforma e conta separados.
- Componentes Sidebar e Drawer do DS, com navegação mobile acessível.
- Main com `w-full`, sem `max-w`: usa toda a largura disponível.

## Organização por tarefa

- Campos de data usam Calendar do DS em Dialog, com meses e dias em português,
  seleção imediata e limites do período. Não usar o calendário nativo de input date.

- Selects compostos com Select/Trigger/Content/Item de `packages/ui`, conforme
  Storybook em `apps/docs`. Filtros, cadastros e exceções usam o mesmo componente.
- Visão geral com acesso direto aos cadastros; `?create=1` abre o formulário.
- Lista empresarial com atalhos Filiais e Plano. A aba escolhida permanece na URL.
- Nova filial disponível no cabeçalho da empresa, em qualquer aba.
- Busca de usuários automática após 250ms; filtros de empresas e planos imediatos.
- Auditoria filtra por nome do responsável; não exige digitar UUID.
- Preferências pessoais abaixo dos controles globais em Configurações.
- Edição de usuário por `?edit=<id>` permite abrir o formulário a partir da empresa.
- Planos incluem o módulo completo com uma ação; exceções podem ser restauradas
  em conjunto. Essas alterações continuam dependendo de Salvar e motivo.
- Confirmações de ações globais, suspensão e promoção permanecem obrigatórias.

## Atualizacao de 27/10/2026

O manual em `docs/brand-manual.md` substitui as decisoes anteriores sobre Nitro, azul intenso, Space Grotesk e densidade. A base passa a ser @trinketos/ui, azul sobrio e tipografia Inter. Preservar apenas as regras anteriores que nao conflitam com o manual.

## Referencia de varejo e layouts — versao 2

A fonte normativa e `docs/brand-manual.md` (versao 2), fundamentada em `docs/retail-reference-study.md`. Composicoes canonicas em `packages/ui/src/components/page-layout.tsx`; consulta visual no Storybook Store Flow / Manual da marca. Manter as cores aprovadas e usar a densidade compacta com alvos maiores em toque.
