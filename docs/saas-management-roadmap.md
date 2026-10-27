# Gestão SaaS: TrinketOS → Store Flow

Levantamento do código local em 05/10/2026. A ordem abaixo prioriza isolamento, controle de acesso, suporte e evolução comercial. A referência é a gestão do TrinketOS; atendimento, dispositivos e IA não devem ser transplantados para o varejo.

| Ordem | Padrão observado no TrinketOS | Adaptação ao Store Flow | Situação |
| --- | --- | --- | --- |
| 1 | SUPER_ADMIN separado da operação do tenant | `/backoffice/*` para plataforma; ADMIN da empresa; MANAGER/EMPLOYEE da filial; CUSTOMER com acesso próprio | Implementado: segmentação e validação da sessão atual |
| 2 | Organizações, detalhes e suspensão/reativação | Tenant = empresa; Store = filial. Administrador responsável, status empresarial e isolamento de dados por filial | Implementado; perfil e logo com upload/revisão ainda pendentes |
| 3 | Planos com módulos, flags e exceções por organização | Plano e exceções no Tenant, aplicados a todas as filiais; acesso também depende de role e vínculo | Implementado; acrescentada visão do acesso efetivo para o ADMIN |
| 4 | Kill switches globais e modo de manutenção | Bloquear módulo ou funcionalidade operacional sem impedir recuperação pelo backoffice | Implementado; recursos sem persistência agora são marcados como indisponíveis |
| 5 | Auditoria das intervenções administrativas | Motivo, responsável, alvo e antes/depois de mudanças de empresa, conta, plano e controles | Implementado com gravação transacional e consulta paginada |
| 6 | Visão geral e analytics da plataforma | Empresas ativas/suspensas, filiais, empresas sem filiais, distribuição por plano e disponibilidade | Acrescentado `/backoffice/analytics` com endpoint real; sem estimativas de receita |
| 7 | Configuração de limites por tenant | Limites de filiais, membros da equipe, produtos e armazenamento, definidos pelo plano e por exceção empresarial | Pendente; aplicar no backend com transações e proteção contra concorrência, não apenas no formulário |
| 8 | Solicitações empresariais com aprovação/negação | Fila de upgrade, trial, cancelamento e suporte, com decisão motivada, responsável e histórico por empresa | Pendente; criar modelo persistido e entrada no ADMIN antes da fila do SUPER_ADMIN |
| 9 | Trial ofertado, aceito, cancelado, retomado ou convertido, com histórico e expiração | Trial empresarial de um plano publicado, válido para as filiais; separar oferta, uso, carência e retorno ao plano anterior | Pendente; depende do ciclo de solicitação e regras de limites. Não usar `status` da empresa como status comercial |
| 10 | Comunicados da plataforma | Avisos publicados com período, público por empresa/role e apresentação no app operacional | Pendente; rascunho/publicação/arquivamento, auditoria e consumo real pelo ADMIN |
| 11 | Changelog/novidades do produto | Comunicar novas funcionalidades de estoque, compras e varejo, com publicação e histórico | Pendente; reutilizar o padrão editorial dos comunicados |
| 12 | Compliance e revisão do perfil/logo | Solicitações de privacidade/cancelamento e revisão de identidade da empresa | Pendente; adaptar políticas de retenção e privacidade ao cadastro de clientes e dados comerciais |

## Dependências comerciais adicionais do Store Flow

Preço cadastral de plano não é assinatura e não comprova receita. Cobrança real exige assinatura, periodicidade, faturas, eventos de pagamento, reconciliação e cancelamento. O levantamento não identificou um fluxo completo de faturamento no backoffice do TrinketOS que possa simplesmente ser copiado. Essa evolução deve acompanhar limites e trials, mantendo o status comercial separado do status de acesso da empresa.

Os limites sugeridos acima são decisões de produto para o varejo, não funcionalidades já implementadas. A distribuição de planos desta entrega inclui empresas suspensas: representa vínculos cadastrais, não clientes pagantes.

## Incrementos desta entrega

- `GET /admin/analytics`: exclusivo do SUPER_ADMIN; contagens globais por consulta agregada no PostgreSQL, distribuição por plano, controles e horário de geração.
- `/backoffice`: indicadores SaaS consolidados na Visão geral, com tabs Empresas, Planos e Plataforma, usando o DS, bordas retas e conteúdo full width. `/backoffice/analytics` redireciona para `/backoffice?tab=plans` para preservar links existentes.
- `GET /operations/plan`: plano e acesso efetivo da empresa da filial autorizada. Não expõe exceções brutas nem os bloqueios de outras funcionalidades da plataforma.
- `/admin/dashboard/settings/plan`: visão do plano para o ADMIN, com motivos em português para manutenção, bloqueio global, módulo/funcionalidade não habilitados e recurso não implementado.
- `sales.orders`, `finance.cash` e `finance.receivables` indisponíveis no catálogo enquanto não houver persistência. Exceções não conseguem habilitar um recurso ausente. Clientes, estoque, catálogo, compras e indicadores existentes permanecem disponíveis conforme plano e permissões.

## Evidências no TrinketOS

- `web-trinketos/src/domains/backoffice/components/backoffice-sidebar.tsx`: grupos Operação, Produto e Plataforma, com organizações, compliance, planos, comunicados, novidades, analytics, auditoria e configurações.
- `api-trinketos/src/main/java/com/trinket/trinketos/controller/BackofficeController.java`: visão geral, listagem paginada, detalhes, suspensão, configuração/flags, solicitações, revisão de logo, comunicados, changelog, controles e analytics.
- `api-trinketos/src/main/java/com/trinket/trinketos/service/BackofficeService.java`: decisões de solicitações, configuração empresarial, distribuição de planos/status e consulta de compliance.
- `api-trinketos/src/main/java/com/trinket/trinketos/controller/BackofficeTrialController.java` e `service/TrialService.java`: oferta e ações de trial.
- `web-trinketos/src/domains/backoffice/features/tenant-detail/tenant-trial-card.tsx`: oferta, cancelamento, retomada e conversão do trial no detalhe da empresa.

## Critérios para as próximas etapas

Cada incremento precisa reunir persistência, endpoint com isolamento e permissões, tela administrativa, consumo operacional e auditoria das decisões. Listas recebem paginação do servidor. Testes verificam acesso entre empresas, mudanças de estado e efeitos reais dos controles. Não adicionar cards ou menus que anunciem um fluxo ainda sem implementação.
