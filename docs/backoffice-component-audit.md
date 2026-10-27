# Componentes do SUPER_ADMIN

Fonte visual: `apps/docs/src/stories`, com implementação compartilhada em `packages/ui`. A interface usa bordas retas e conteúdo com largura total.

## Levantamento e substituições

| Elemento | Situação encontrada | Implementação atual |
| --- | --- | --- |
| Modais de formulário e confirmação | Primitivos do DS com largura, rolagem, padding e botão de fechar alterados localmente | `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription` e `DialogFooter` do DS, sem sobrescritas de aparência |
| Formulários extensos | `sm:max-w-3xl` repetido nos consumidores | Variante `size="wide"` do DS, documentada na história `Wide`; variante padrão permanece `max-w-md` |
| Modal de data | Padding e largura particulares | Dialog padrão; calendário continua sendo `Calendar` do DS |
| Tabelas | HTML e estilos locais em seis telas/painéis | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` |
| Status das contas e empresas | `span` com cores fixas | `Badge`, variantes `success`, `secondary` e `warning` |
| Seleção de módulos e funcionalidades | Checkbox nativo com `accent-primary` | `Checkbox` do DS, mantendo seleção e indisponibilidade |
| Superfícies de cartões | `div`/`section` com borda e fundo replicados | `Card` do DS, mantendo disposição do conteúdo |
| Erros, confirmações de sucesso e carregamento | Parágrafos e caixas estilizados localmente | `Alert`/`AlertDescription` e `Card`/`CardContent` para carregamento |
| Resultados vazios | Parágrafos isolados | `EmptyState`, `EmptyStateContent`, `EmptyStateDescription` |
| Alterações da auditoria | `details`/`summary` nativos | `Accordion` do DS |
| Selects | DS com classe visual duplicada e estilos locais nos itens | Composição `SelectField` usando `Select`, trigger, conteúdo e itens do DS sem essas sobrescritas |
| Botão de tentar carregar responsáveis | Botão HTML local | `Button` do DS |
| Sidebar, drawer, tabs, inputs, labels, switches e botões | Já utilizavam o DS | Componentes compartilhados mantidos |

## Composições mantidas

- `FormDialog` e `ActionDialog`: organizam formulários e confirmação com motivo, protegendo fechamento durante uma mutação. Não implementam overlay, foco ou aparência próprios.
- `SelectField`: traduz a opção vazia e integra valores com formulários e reset; os componentes visuais são do DS.
- `DateField`: converte datas locais, aplica limites e fecha após a seleção; usa Dialog e Calendar do DS.
- `FeatureMatrix`: controla módulos e funcionalidades do plano; usa Checkbox e Button do DS. `fieldset` e `legend` representam grupos semânticos de formulário.
- `PageHeading`, shell e painéis: organizam conteúdo e navegação específicos da aplicação. Não há componente equivalente no catálogo que precise ser duplicado.
- Espaçamento, grids, largura de campos e posicionamento de conteúdo permanecem responsabilidade das páginas; cores, bordas, estados e comportamento dos controles vêm do DS.

## Regras de manutenção

Não sobrescrever os estilos dos controles por seletores globais no backoffice. Variantes reutilizáveis devem ser implementadas em `packages/ui` e demonstradas em `apps/docs`. A largura total do conteúdo é responsabilidade do layout, não da largura dos modais.

Escopo: segmento SUPER_ADMIN. As telas operacionais preservadas para uma futura aplicação não foram migradas nesta revisão.

## Organização das páginas

- Empresas e planos: busca à esquerda com label acima do campo; status à direita com label apenas para leitores de tela. Limpar aparece apenas quando há filtros.
- Usuários: busca imediata com rótulo visível e controles que quebram linha em telas estreitas.
- Auditoria: ação no primeiro nível; responsável e datas em Accordion de filtros avançados. A contagem e o resumo dos filtros ativos ficam visíveis quando o painel está fechado. Limpar restaura todos os filtros e a página inicial em uma ação.
- Empresas: nome abre a administração; contagem de filiais abre diretamente a aba de filiais. Os atalhos existentes para filiais e plano permanecem disponíveis.
- Configurações: controles globais precedem conta e aparência, que ficam em um painel expansível. A busca de módulos usa uma faixa compacta.
- Ações de criação continuam no cabeçalho; confirmação de operações globais e coleta de motivo permanecem obrigatórias.

Essa organização preserva filtros imediatos sem um botão adicional de aplicar, prioriza tarefas administrativas e reduz a área fixa acima dos resultados. A validação visual responsiva ainda precisa ser realizada em navegador.

## Listas e identidade da empresa

Empresas, planos, filiais e usuários da empresa usam paginação no servidor, com 20 itens por página no backoffice. Os endpoints retornam `items`, `total`, `page`, `perPage` e `totalPages`; o Prisma aplica filtros, ordenação estável, `skip` e `take` no banco. Usuários globais e auditoria mantêm sua paginação no servidor.

Endpoints: `GET /tenants`, `GET /admin/stores`, `GET /tenants/:tenantId/stores`, `GET /admin/tenants/:tenantId/users` e `GET /admin/plans`. `page` começa em 1; `perPage` aceita de 1 a 100 (padrão 20). Busca e status de empresas e planos são aplicados antes da contagem. A resposta destas listagens mudou de array para envelope paginado.

A listagem de empresas inclui `branchCount`. A visão geral consulta somente cinco empresas recentes e páginas de um registro para contagens. A seleção de planos publicados também oferece busca e paginação; `GET /admin/plans/:id` preserva o plano selecionado ao navegar entre páginas, sem baixar todos os planos.

O resumo da empresa reserva um espaço quadrado para identidade visual usando Avatar do DS e iniciais como fallback. O modelo atual de Tenant não tem campo de logo; upload e persistência de imagem não foram implementados nesta revisão.
