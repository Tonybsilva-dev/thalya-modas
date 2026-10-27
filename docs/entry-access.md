# Porta de entrada e cadastros

Atualizado em 27/10/2026.

## Infraestrutura compartilhada

Usar a infraestrutura existente do TrinketOS: PostgreSQL em `localhost:5433`, com base separada `store-flow`, e Redis em `127.0.0.1:6379`. Não provisionar containers de banco, cache ou fila para o Store Flow. A URL do Redis pode incluir autenticação conforme o serviço compartilhado; configurar em `apps/api/.env` sem registrar credenciais no repositório.

Chaves de segurança recebem o prefixo `store-flow:security:`. Não executar `FLUSHDB` ou `FLUSHALL`, alterar persistência ou reiniciar o Redis compartilhado durante os testes. Os testes de integração removem somente suas próprias chaves. Revogações e contadores dependem da disponibilidade e retenção desse Redis; operação compartilhada deve preservar essas chaves durante o prazo das sessões.

Em produção, `REDIS_URL` é obrigatória. Sem Redis em desenvolvimento, o adapter em memória permite testes locais, mas não compartilha estado entre processos. Com Redis configurado, falhas de verificação retornam 503; não há fallback silencioso para memória. `TRUST_PROXY=false` é o padrão: configurar proxies confiáveis na implantação antes de depender de IP encaminhado.

## Cadastro e ativação

1. `/auth/register` cria o proprietário, inicia onboarding e estabelece o cookie da sessão. A criação administrativa de funcionário não substitui o cookie de quem administra.
2. `/onboarding` coleta perfil, endereço e preferências. `/auth/me` informa a próxima etapa; recarregar retoma os dados salvos no servidor.
3. `/onboarding/plan` mostra Starter, Professional e Business. Somente Starter pode ser confirmado. Não há checkout, cobrança nem promessa de recursos ainda não implementados.
4. Após confirmação, o proprietário entra em `/admin/dashboard`, com a filial selecionada. A API bloqueia operação da loja enquanto o onboarding do proprietário e o plano estiverem pendentes.

O plano inicial mantém o identificador existente; a migração renomeia somente o plano padrão chamado “Padrão”. A confirmação não redefine planos já escolhidos nem substitui planos atribuídos por administração.

## Segurança de sessão

- Três falhas de login normalizadas por e-mail iniciam bloqueio de dois minutos. Há também controle agregado por IP. Contadores e expiração são atômicos no Redis.
- JWTs têm identificador único, versão de sessão e prazo máximo de 30 dias. Cadastro público e login emitem cookie httpOnly; login permite “lembrar de mim”.
- `POST /auth/logout` revoga a sessão corrente, incluindo seu uso como bearer token.
- `POST /auth/logout-all` revoga todas as sessões anteriores. Novo login recebe a versão atual.
- Redefinição de senha e alterações administrativas de e-mail, papel ou status revogam sessões anteriores. Dados atuais de conta e vínculo continuam sendo revalidados.
- O token de redefinição é consumido atomicamente para impedir uso concorrente. Requisições de código têm expiração, tentativas limitadas e cooldown de reenvio.

## Recuperação e e-mails

As telas de solicitação, código e nova senha consomem a API. Código e token ficam fora da URL; o token de redefinição fica somente em memória no navegador. Recarregar reinicia o fluxo.

**O envio de e-mails não está implementado nesta etapa.** Não existe entrega automática de código nem fila de notificações. A interface informa a indisponibilidade, e códigos de debug só aparecem em testes automatizados. Os pontos de extensão não são confirmação de entrega. Ver [mapa de eventos de e-mail](email-events.md).

## Status e suporte

`/health` verifica o processo. `/health/deep` consulta o banco e executa PING no Redis configurado, com timeout; falha de dependência configurada produz 503. Filas retornam `not_configured` enquanto não existir worker real. Isso mantém o resultado agregado como `degraded`, mesmo com banco e Redis saudáveis.

O indicador do login consulta o endpoint a cada 30 segundos e permite expandir o detalhe de cada serviço. A resposta pública não divulga host, senha ou diagnóstico interno.

Erros retornam código estável e trace ID, presente também no header e nos logs estruturados. A interface oferece copiar a referência nos fluxos migrados. Pesquisar pelo campo `traceId` nos logs da API. Coleta centralizada em Grafana/Loki/Tempo e instrumentação OpenTelemetry permanecem uma integração operacional futura; não há backend de observabilidade provisionado nesta entrega.

## Cadastros comerciais

Clientes têm modelo próprio, isolado por filial, sem exigir conta de login ou e-mail. Há criação, busca paginada, consulta, edição e inativação, preservando o registro. CPF/CNPJ é único por filial quando informado; a validação atual confere quantidade de dígitos, sem consulta externa de titularidade.

A migração cria um registro comercial para cada vínculo ativo de usuário CUSTOMER já existente. Contas de acesso permanecem separadas; cadastrar novo usuário CUSTOMER não cria automaticamente um cliente comercial.

Fornecedores podem existir sem produtos ou pedidos. Produtos podem existir sem fornecedor e com `inventoryControl=untracked`, sem controle de saldo. Pedidos de venda, conta corrente e promissórias continuam fora desta entrega.

## Identidade

O [manual de marca](brand-manual.md) define azul sóbrio, Inter, densidade compacta e ações priorizadas. `packages/ui` adapta os primitivos publicados de `@trinketos/ui@0.2.0`; componentes ainda não migrados continuam locais. A declaração de peer dependency do pacote é React 18; o aplicativo mantém React 19. Build, TypeScript e renderização de testes passam, mas a revisão visual em navegador continua necessária antes de expandir a substituição.
