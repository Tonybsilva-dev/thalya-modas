# Validação — 27/10/2026

| Verificação | Resultado |
| --- | --- |
| API completa, com PostgreSQL e Redis compartilhados | 56 arquivos, 479 testes aprovados, nenhum ignorado |
| Backoffice: proxy, contrato de erro e renderização da visão geral | 37 testes aprovados |
| API: Biome check | Aprovado; permanecem avisos, principalmente assertions não nulas |
| Backoffice: ESLint completo | Aprovado sem diagnósticos |
| TypeScript: API, UI, Storybook e backoffice | Aprovado por compilação direta e build do Next.js |
| Build do backoffice | Aprovado |
| Migrações Starter e clientes comerciais | Aplicadas na base `store-flow`, em localhost:5433 |
| Health check da API em execução | Banco `ok`, Redis `ok`, filas `not_configured`; agregado `degraded` |

Os testes Redis usam `127.0.0.1:6379`, com prefixo `store-flow:security:` e remoção apenas das próprias chaves. Não foi mantido nenhum container adicional. O PostgreSQL utilizado é o serviço compartilhado na porta 5433; não foi alterado o banco do TrinketOS.

O wrapper `pnpm typecheck` tentou regenerar Prisma durante uso da DLL pelo servidor local e encontrou `EPERM` do Windows. O client já havia sido gerado com o schema atualizado; os quatro projetos foram verificados diretamente, sem encerrar o servidor do usuário. Isso não substitui geração do client no CI, onde os processos de teste não devem estar usando a DLL.

## Escopo dos testes novos

- Três tentativas inválidas e dois minutos de bloqueio, incluindo expiração.
- Logout corrente, logout global, continuidade de uma segunda sessão e novo login após revogação.
- Redefinição concorrente: somente uma requisição consome o token; sessões anteriores são rejeitadas.
- Alteração administrativa de papel revoga a sessão anterior e exige novo login.
- Cadastro público estabelece cookie httpOnly e permite consultar a sessão.
- Retomada de onboarding, bloqueio de ativação precoce, rejeição de Business e confirmação idempotente do Starter.
- Proxy impede pular etapas ou entrar na loja antes de escolher o plano.
- Clientes comerciais sem login, edição, busca, inativação, documentos duplicados por filial e isolamento entre filiais, em memória e PostgreSQL.
- Contadores atômicos no Redis, revogação compartilhada e falha fechada quando o cliente Redis fica indisponível.
- Health check consulta dependências reais, devolve 503 em falha e não expõe diagnóstico sensível.

## Limites

Não houve inspeção visual nem navegação E2E: o ambiente de uso do computador retornou ausência de navegadores e indisponibilidade da conexão nativa. Responsividade, foco e interação dos componentes publicados precisam dessa revisão. O pacote TrinketOS 0.2.0 declara React 18; o aplicativo permanece em React 19, com compilação e testes de renderização aprovados.

Entrega de e-mails, workers de filas e coleta externa de observabilidade permanecem pendentes conforme `entry-access.md` e `email-events.md`. Não foram simulados como serviços saudáveis.

Um backoffice de desenvolvimento já estava registrado na porta 3000. A tentativa de iniciar outra instância na 3001 foi recusada pelo Next.js; o processo existente foi preservado.


## Revisão da identidade e dos layouts

Manual próprio atualizado para versão 2, com estudo de referências primárias do varejo e limites de evidência em `retail-reference-study.md`. Exemplos consultáveis no Storybook em Store Flow / Manual da marca.

A camada de layout passa a compor PageHeader publicado do TrinketOS com regras Store Flow. Cabeçalhos das páginas administrativas, produtos, fornecedores, formulários de produtos/compras e sobre usam o padrão comum; clientes compartilham busca e tabela na mesma superfície. Os shells adotam PageLayout. Acordeons usam altura automática e intervalos definidos no manual.

Validação desta revisão: build Next.js e build Storybook aprovados; 37 testes do backoffice aprovados; TypeScript de UI, aplicação e documentação aprovado; ESLint completo do backoffice sem diagnósticos. Os testes de renderização inicialmente detectaram falta de import de React no componente compartilhado sob o runtime Node; a correção foi aplicada e a suíte passou novamente.

A renderização visual em navegador permanece pendente: nova tentativa de inventário retornou ausência de navegadores e conexão nativa indisponível. Não foi alegada aprovação visual, de responsividade ou de interação E2E. Não houve alteração de contratos de API, transporte de e-mails, banco compartilhado nem provisionamento de containers nesta revisão.


## Vendas, caixa, contas e densidade — revisão final

Implementadas tabelas de pedidos/itens/parcelas/recebimentos/caixas/movimentos, rotas com autorização e plano, transações de estoque e dinheiro, idempotência e telas reais. Migrations `20261027140000_sales_cash_receivables` e `20261027141000_sales_integrity` aplicadas no PostgreSQL já existente. Índice parcial limita caixa aberto por filial; constraints protegem valores e saldos. O teste de concorrência comprova que duas vendas não produzem estoque negativo e dois pagamentos não excedem o saldo.

Validações aprovadas: 57 arquivos/486 testes na suíte completa da API com Redis/PostgreSQL; suíte focada de vendas com 8 testes, incluindo a hierarquia adicionada após a rodada completa; 39 testes do backoffice; TypeScript de todos os projetos envolvidos; Prisma validate; Biome completo da API; build Next e build Storybook. O build Storybook mantém o aviso de tamanho de chunks de documentação, sem falha de compilação.

Durante a primeira tentativa de suíte completa, Docker Desktop estava desligado. Postgres e Redis foram restabelecidos nos containers existentes; a suíte completa passou na repetição. Nenhum container foi criado. Os serviços locais de API/backoffice foram iniciados após verificar que as portas estavam livres.

Manual da marca versão 3: seções planas, menos cards, controles alinhados, prefixo R$ nativo do Input TrinketOS, formulários de fornecedor sem painel redundante e histórico expansível. A conversão de moeda aceita `12,50` e `12.50` sem alterar centavos e rejeita formatos inválidos; os totais exibem duas casas. Motion reduzido remove atrasos globalmente; estados de sucesso são anunciados e campos mantêm labels associados.

A inspeção visual por Computer Use foi encerrada pela ferramenta ao não conseguir identificar a URL atual com segurança. Nenhuma validação visual, de responsividade ou E2E foi alegada. Devoluções/estornos de vendas pagas, processamento bancário, emissão fiscal e entrega de e-mails continuam fora desta base; os eventos de e-mail e seus motivos constam em `email-events.md`.
