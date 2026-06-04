# TODO - Funcionalidades do Backoffice e API

Este arquivo mapeia as rotas existentes em `apps/backoffice` e traduz cada tela em funcionalidades para implementar em `apps/api` usando persistência in-memory, testes automatizados e, depois, Prisma/Postgres.

Escopo inicial: rotas públicas do backoffice. Rotas protegidas do dashboard e o fluxo de catálogo/fornecedores foram iniciados em seções próprias abaixo.

## Convenções

- Manter arquitetura atual da API: `domain`, `application/use-cases`, `infra/persistence/in-memory`, `app/http/routes` e testes em `tests/integration`.
- Toda funcionalidade nova deve ter repositório in-memory quando houver estado temporário.
- Toda rota deve ter schema Zod, documentação Swagger e testes de integração.
- Fluxos temporários devem ser determinísticos em teste, mas sem expor código sensível em respostas de produção.
- Para preview da interface, seedar ao menos um usuário gerente compatível com o login do backoffice.
- Antes de criar implementação Prisma/Postgres, a funcionalidade precisa existir e passar em testes usando repositórios in-memory.
- Kill switches devem ser validados na camada de aplicação/use case, antes de efeitos colaterais como gerar token, criar código, enviar e-mail ou gravar em banco.

## Estratégia de kill switches

### Recomendação

Usar kill switches por módulo de funcionalidade, carregados por configuração de ambiente e expostos ao container da aplicação por um `FeatureFlagService` simples.

O fluxo recomendado para cada funcionalidade é:

1. Implementar domínio, use case e repositório in-memory.
2. Cobrir comportamento feliz, erros e kill switch com testes.
3. Só depois criar persistência Prisma/Postgres.
4. Manter os mesmos testes de contrato rodando contra in-memory e, quando viável, contra Prisma.

### Estrutura sugerida

- [x] Criar `src/shared/features/feature-flags.ts`.
- [x] Criar `src/shared/features/index.ts`.
- [x] Adicionar `featureFlags` ao `AppContainer`.
- [x] Adicionar variáveis de ambiente booleanas em `src/shared/env/env.ts`.
- [x] Criar erro padronizado para módulo desabilitado, preferencialmente `ForbiddenError` ou novo `FeatureDisabledError`.
- [x] Adicionar testes de integração para cada módulo desabilitado.
  - [x] Auth login.
  - [x] Auth register.
  - [x] Password recovery.
  - [ ] SSO, se endpoint mock for criado.

### Padrão de variáveis

Usar prefixo explícito:

- `FEATURE_AUTH_LOGIN_ENABLED`
- `FEATURE_AUTH_REGISTER_ENABLED`
- `FEATURE_PASSWORD_RECOVERY_ENABLED`
- `FEATURE_PASSWORD_RECOVERY_REQUEST_ENABLED`
- `FEATURE_PASSWORD_RECOVERY_VERIFY_CODE_ENABLED`
- `FEATURE_PASSWORD_RECOVERY_RESEND_CODE_ENABLED`
- `FEATURE_PASSWORD_RECOVERY_RESET_ENABLED`
- `FEATURE_AUTH_SSO_ENABLED`

Valores aceitos:

- `true`: módulo habilitado.
- `false`: módulo desabilitado.

Default recomendado:

- Login: `true`.
- Register: `true` temporariamente para preservar os testes e o boilerplate público atual; revisar para `false` quando houver fluxo administrativo dedicado para criação de usuários.
- Password recovery: `true` em desenvolvimento depois de testado in-memory.
- SSO: `false` até existir provedor real.

### Comportamento HTTP quando desligado

Quando um módulo estiver desligado:

- A rota pode continuar registrada para documentação Swagger.
- O handler deve retornar erro controlado, sem executar o use case.
- Status recomendado: `403`.
- Payload recomendado:

```json
{
  "error": "FeatureDisabledError",
  "message": "Funcionalidade temporariamente indisponível.",
  "feature": "passwordRecovery"
}
```

Não retornar `404`, porque a rota existe; o problema é operacional/configuracional.

### Matriz de módulos públicos

| Kill switch | Rotas afetadas | Quando `true` | Quando `false` |
| --- | --- | --- | --- |
| `FEATURE_AUTH_LOGIN_ENABLED` | `POST /auth/login` | Login valida credenciais, status da conta e emite token. | Login retorna `403`; nenhum token é emitido. |
| `FEATURE_AUTH_REGISTER_ENABLED` | `POST /auth/register` | Registro cria usuário e pode emitir token. | Registro retorna `403`; nenhum usuário é criado. |
| `FEATURE_AUTH_SSO_ENABLED` | `POST /auth/sso/start`, se criado | Inicia fluxo SSO ou mock explícito. | SSO retorna `403` ou `501`, sem criar sessão. |
| `FEATURE_DASHBOARD_ENABLED` | Todas `/dashboard/*` | Dashboard protegido retorna dados operacionais. | Todas as rotas de dashboard retornam `403`. |
| `FEATURE_DASHBOARD_OVERVIEW_ENABLED` | `GET /dashboard/overview` | Retorna visão geral da loja. | Overview retorna `403`. |
| `FEATURE_DASHBOARD_ORDERS_ENABLED` | `GET /dashboard/orders` | Retorna pedidos e filas operacionais. | Orders retorna `403`. |
| `FEATURE_DASHBOARD_INVENTORY_ENABLED` | `GET /dashboard/inventory` | Retorna estoque e movimentações. | Inventory retorna `403`. |
| `FEATURE_DASHBOARD_CUSTOMERS_ENABLED` | `GET /dashboard/customers` | Retorna clientes e segmentos. | Customers retorna `403`. |
| `FEATURE_DASHBOARD_CASH_REGISTER_ENABLED` | `GET /dashboard/cash-register` | Retorna caixa, formas de pagamento e venda atual. | Cash register retorna `403`. |
| `FEATURE_DASHBOARD_SUPPLIERS_ENABLED` | `GET /dashboard/suppliers` | Retorna fornecedores e recebimentos. | Suppliers retorna `403`. |
| `FEATURE_DASHBOARD_REPORTS_ENABLED` | `GET /dashboard/reports` | Retorna relatórios e séries. | Reports retorna `403`. |
| `FEATURE_CATALOG_ENABLED` | `/suppliers`, `/products`, `/inventory/*` | Permite cadastrar fornecedores, produtos, preparar imagens e movimentar estoque. | Catálogo retorna `403`; nenhum fornecedor, produto, asset ou movimento é criado. |
| `FEATURE_PASSWORD_RECOVERY_ENABLED` | Todas `/auth/password-recovery/*` | Fluxo completo pode executar conforme switches específicos. | Todas as rotas de recuperação retornam `403`; nenhum código/token é criado. |
| `FEATURE_PASSWORD_RECOVERY_REQUEST_ENABLED` | `POST /auth/password-recovery/request` | Gera código temporário quando aplicável. | Retorna `403`; não cria nem invalida códigos. |
| `FEATURE_PASSWORD_RECOVERY_VERIFY_CODE_ENABLED` | `POST /auth/password-recovery/verify-code` | Valida código e emite `resetToken`. | Retorna `403`; não consome tentativas. |
| `FEATURE_PASSWORD_RECOVERY_RESEND_CODE_ENABLED` | `POST /auth/password-recovery/resend-code` | Reenvia código respeitando cooldown. | Retorna `403`; código anterior permanece como estava. |
| `FEATURE_PASSWORD_RECOVERY_RESET_ENABLED` | `POST /auth/password-recovery/reset` | Atualiza senha com `resetToken` válido. | Retorna `403`; senha não é alterada e token não é consumido. |

### Testes obrigatórios de kill switch

- [x] Quando `FEATURE_AUTH_LOGIN_ENABLED=false`, `POST /auth/login` retorna `403` e não gera token.
- [x] Quando `FEATURE_AUTH_REGISTER_ENABLED=false`, `POST /auth/register` retorna `403` e não cria usuário.
- [x] Quando `FEATURE_PASSWORD_RECOVERY_ENABLED=false`, todas as rotas de recuperação retornam `403`.
- [x] Quando `FEATURE_PASSWORD_RECOVERY_REQUEST_ENABLED=false`, request retorna `403` e não cria código.
- [x] Quando `FEATURE_PASSWORD_RECOVERY_VERIFY_CODE_ENABLED=false`, verify retorna `403` e não incrementa tentativas.
- [x] Quando `FEATURE_PASSWORD_RECOVERY_RESEND_CODE_ENABLED=false`, resend retorna `403` e não invalida o código atual.
- [x] Quando `FEATURE_PASSWORD_RECOVERY_RESET_ENABLED=false`, reset retorna `403` e não altera a senha.
- [x] Quando `FEATURE_DASHBOARD_ENABLED=false`, rotas de dashboard retornam `403`.
- [x] Quando um kill switch individual do dashboard está desligado, somente a rota correspondente retorna `403`.
- [x] Quando `FEATURE_CATALOG_ENABLED=false`, rotas de catálogo e estoque retornam `403`.

## Rotas protegidas do dashboard

### Estratégia inicial

- [x] Criar read model in-memory para o dashboard antes de persistência transacional.
- [x] Proteger todas as rotas com autenticação por `Authorization: Bearer <token>` ou cookie `@thalya-modas:session`.
- [x] Documentar contratos no Swagger.
- [x] Adicionar kill switch global e individual por módulo.
- [x] Adicionar testes de integração para autenticação, resposta feliz e kill switch.
- [x] Conectar backoffice às APIs protegidas via React Query.
- [ ] Evoluir read models para Prisma/Postgres conforme cada módulo ganhar regras de escrita.

### Mapeamento inicial implementado

| Rota | Tela do backoffice | Status de API |
| --- | --- | --- |
| `GET /dashboard/overview` | `dashboard-local-store-management--overview-route` | In-memory implementado |
| `GET /dashboard/orders` | `dashboard-local-store-management--orders-route` | In-memory implementado |
| `GET /dashboard/inventory` | `dashboard-local-store-management--inventory-route` | In-memory implementado |
| `GET /dashboard/customers` | `dashboard-local-store-management--customers-route` | In-memory implementado |
| `GET /dashboard/cash-register` | `dashboard-local-store-management--cash-register-route` | In-memory implementado |
| `GET /dashboard/suppliers` | `dashboard-local-store-management--suppliers-route` | In-memory implementado |
| `GET /dashboard/reports` | `dashboard-local-store-management--reports-route` | In-memory implementado |

### Próximas pendências protegidas

- [x] Mapear e implementar detalhes de cliente: `GET /dashboard/customers/:customerId`.
- [x] Mapear e implementar promissória do cliente: `GET /dashboard/customers/:customerId/promissory`.
- [x] Mapear primeira leva de ações de escrita para fornecedores, produtos, assets e estoque.
- [ ] Mapear ações de escrita para pedidos, caixa e relatórios.
- [x] Definir contratos de paginação/filtros com `page`, `perPage`, `q`, `status` e período.

## Catálogo, produtos, fornecedores e estoque

### Estratégia inicial

- [x] Implementar primeiro in-memory com testes antes de Prisma/Postgres.
- [x] Criar módulo protegido separado do read model de dashboard.
- [x] Validar autenticação por `Authorization: Bearer <token>` ou cookie `@thalya-modas:session`.
- [x] Criar kill switch global `FEATURE_CATALOG_ENABLED`.
- [x] Documentar contratos no Swagger via schemas das rotas.
- [x] Preparar contrato de upload direto para R2 exigindo `image/webp`.
- [x] Criar util compartilhado no backoffice para converter imagens para WebP antes do upload.
- [x] Implementar adapter Cloudflare R2 com URL assinada no formato virtual-hosted bucket e `x-id=PutObject`.
- [ ] Validar upload real ponta a ponta contra o bucket R2 em ambiente local.
- [x] Levar fornecedores, produtos, assets e movimentos para Prisma/Postgres.

### API implementada in-memory

- [x] `GET /suppliers`
- [x] `POST /suppliers`
- [x] `GET /suppliers/:id`
- [x] `PATCH /suppliers/:id`
- [x] `DELETE /suppliers/:id`
- [x] `GET /suppliers/:id/responsibles`
- [x] `POST /suppliers/:id/responsibles`
- [x] `PATCH /suppliers/:id/responsibles/:responsibleId`
- [x] `DELETE /suppliers/:id/responsibles/:responsibleId`
- [x] `GET /products`
- [x] `POST /products`
- [x] `GET /products/:id`
- [x] `PATCH /products/:id`
- [x] `POST /products/:productId/assets/upload`
- [x] `POST /inventory/adjustments`
- [x] `GET /inventory/movements`

### Validações implementadas

- [x] Nome de fornecedor obrigatório com mínimo de 2 caracteres.
- [x] Documento de fornecedor único por usuário/loja.
- [x] Documento de fornecedor normalizado no backoffice para dígitos antes de enviar.
- [x] Telefone de fornecedor normalizado no backoffice para dígitos antes de enviar.
- [x] Categoria de fornecedor usa enum reutilizável: `women_fashion`, `accessories`, `footwear`, `mens_fashion`, `packaging`.
- [x] Prazos comerciais usam enum reutilizável: `+3`, `+5`, `+7`, `+15`, `+30`, `+45`.
- [x] Status de fornecedor limitado a `active` ou `inactive`.
- [x] Responsável de fornecedor exige nome, cargo, telefone, e-mail, tipo de contato, principal e status.
- [x] Tipo de contato do responsável limitado a `orders`, `delivery` ou `financial`.
- [x] Apenas um responsável principal permanece ativo por fornecedor.
- [x] Excluir fornecedor remove também seus responsáveis in-memory.
- [x] Excluir responsável remove apenas o contato vinculado ao fornecedor correspondente.
- [x] Produto exige nome e SKU.
- [x] SKU único por usuário/loja.
- [x] Produto não pode vincular fornecedor inexistente.
- [x] Ajuste de estoque não permite saldo negativo.
- [x] Upload de asset aceita apenas `image/webp` e arquivo `.webp`.
- [x] Tamanho máximo inicial de imagem: 5MB.

### Fluxo recomendado para imagens no R2

1. Backoffice converte o arquivo selecionado para `.webp` com `convertImageFileToWebp`.
2. Backoffice chama `POST /products/:productId/assets/upload` com `fileName`, `contentType=image/webp` e `size`.
3. API valida produto, contrato e permissão.
4. API gera URL assinada do R2.
5. Backoffice faz `PUT` direto no R2.
6. API mantém metadados do asset vinculados ao produto.

### Fluxo de fornecedores validado em 2026-06-03

#### Backoffice implementado

- [x] Tela principal `/manager/dashboard/suppliers` consome `GET /suppliers` via React Query.
- [x] Filtros da tela principal usam `nuqs` e enviam query para a API.
- [x] Listagem aplica `q`, `status`, `page` e `perPage` no contrato de catálogo.
- [x] Métricas da tela principal são derivadas dos fornecedores retornados pela API.
- [x] Empty state para ausência de fornecedores.
- [x] Botão principal corrigido para `Novo fornecedor`.
- [x] Tela de cadastro `/manager/dashboard/suppliers/create`.
- [x] Tela de edição `/manager/dashboard/suppliers/:supplierId/edit`.
- [x] Modal de exclusão controlado por query string (`modal=delete`).
- [x] Modal de responsáveis controlado por query string (`modal=responsible`).
- [x] Responsáveis em fornecedor persistido usam API (`GET/POST/PATCH/DELETE /suppliers/:id/responsibles`).
- [x] Responsáveis antes do fornecedor existir usam Zustand e são enviados após criar o fornecedor.
- [x] Formulários usam Zod no cliente antes de chamar a API.
- [x] Categorias e prazos são selects reutilizáveis, não campos digitáveis.
- [x] Campo de responsável no formulário aparece apenas quando há responsável atribuído.
- [x] Lista de responsáveis abre no modal e cada responsável abre formulário de edição.
- [x] É possível excluir responsável pelo modal.
- [x] `React Query`, `Zustand` e `nuqs` estão presentes no fluxo.
- [x] Traduções adicionadas para português, inglês e espanhol no fluxo de fornecedores.

#### API validada

- [x] Autenticação obrigatória nas rotas de catálogo.
- [x] Cookie `@thalya-modas:session` ou `Authorization: Bearer` aceitos pelo middleware.
- [x] Kill switch `FEATURE_CATALOG_ENABLED` bloqueia catálogo com `403`.
- [x] Swagger documenta fornecedores, responsáveis, produtos, upload e estoque.
- [x] Testes de integração cobrem criação de fornecedor, produto, ajuste de estoque, responsáveis, upload WebP e kill switch.
- [x] Teste valida que ao tornar o segundo responsável principal, o primeiro deixa de ser principal.
- [x] Teste valida exclusão de responsável.
- [x] Repositório Prisma/Postgres cobre fornecedores, responsáveis, produtos, assets WebP e movimentos de estoque.

#### Validação executada

- [x] `pnpm --filter @thalya-modas/api test -- tests/integration/catalog/catalog.routes.spec.ts`
  - Resultado observado: suíte da API executada com 34 arquivos passando, 356 testes passando e 2 testes Prisma opt-in pulados.
- [x] `pnpm --filter @thalya-modas/api exec biome check src/app/http/server.ts src/core/infra/persistence/in-memory/in-memory-catalog-repository.ts src/core/infra/storage/r2-presigned-upload.ts src/shared/env/env.ts scripts/validate-r2-upload.ts tests/unit/core/infra/storage/r2-presigned-upload.spec.ts tests/unit/shared/env/env.spec.ts package.json`
  - Resultado observado: passou.
- [x] `pnpm --filter @thalya-modas/api build:check`
  - Resultado observado: passou.
- [x] `pnpm --filter @thalya-modas/api db:deploy`
  - Resultado observado: passou com Postgres local; 2 migrations registradas e nenhuma migration pendente.
- [x] `RUN_PRISMA_INTEGRATION_TESTS=true pnpm --filter @thalya-modas/api exec vitest run --fileParallelism=false tests/integration/catalog/catalog-prisma.spec.ts`
  - Resultado observado: 2 testes Prisma/Postgres de catálogo passaram contra o banco local.
- [x] `pnpm --filter @thalya-modas/backoffice lint`
  - Resultado observado: passou.
- [ ] `pnpm --filter @thalya-modas/api r2:validate`
  - Resultado observado: `PUT` real retornou `403 AccessDenied` em 2026-06-03. O signer local está coberto por teste unitário e alinhado ao exemplo oficial do Cloudflare R2; a próxima verificação deve focar permissão do token, bucket selecionado, endpoint/account id e política de escrita do R2.

#### Lacunas do fluxo de fornecedores

- [x] Persistência Prisma/Postgres para catálogo (`Supplier`, `SupplierResponsible`, `Product`, `ProductImageAsset`, `InventoryMovement`).
- [x] Adapter Cloudflare R2 com URL assinada sem dependência externa.
- [ ] Validar upload real ponta a ponta usando `PUT` direto para a URL assinada retornada pela API.
- [ ] Tela principal de fornecedores ainda não possui dados reais de pedidos de compra, recebimentos, notas fiscais, atrasos e valores em aberto.
- [ ] Modelar `PurchaseOrder` para substituir os textos operacionais de plano de entrega.
- [ ] Modelar `Receiving` para recebimentos, doca, volumes, recebedor, divergências e nota fiscal.
- [ ] Modelar financeiro de fornecedor para pendências de pagamento, atrasos e valor aberto.
- [ ] Conectar ações em massa da tela principal: agendar recebimento, exportar notas e pedir novos termos.
- [ ] Conectar botão/fluxo de novo pedido de compra quando o módulo de compras existir.
- [x] Adicionar testes específicos para `GET /suppliers` com `q`, `status`, `page` e `perPage`.
- [x] Adicionar testes específicos para `PATCH /suppliers/:id` com documento duplicado.
- [x] Adicionar testes específicos para `DELETE /suppliers/:id` removendo responsáveis vinculados.
- [x] Adicionar testes específicos para responsáveis de outro fornecedor/usuário retornarem `404`.
- [ ] Adicionar estados de loading/error específicos no backoffice para create/edit/delete/responsibles além do fallback atual.
- [ ] Substituir IDs técnicos na tabela por códigos comerciais quando existir modelo de pedido/fornecedor mais rico.

### Mapeamento dos formulários a partir das telas atuais

#### Tela `dashboard-local-store-management--inventory-route`

Sinais visuais existentes:

- Botão principal: `Adicionar item`.
- Botão secundário: `Escanear`.
- Busca por `SKU`, produto e código de barras.
- Tabela: `Item`, `SKU`, `Em mãos`, `Reservado`, `Canal`, `Status`.
- Filtros: todos, baixo estoque, para contar, novidades, listados online, atraso fornecedor.
- Ações em massa: imprimir etiquetas, transferir unidades, criar pedido de compra.
- Painel lateral: item selecionado com imagem, SKU, tamanho e cor.
- Plano de reposição: mínimo, em mãos, reservado e compra sugerida.

Formulário recomendado: cadastro/edição de produto.

Campos:

- `name`: nome base do produto.
- `sku`: SKU único.
- `barcode`: código de barras, opcional.
- `description`: descrição interna, opcional.
- `supplierId`: fornecedor padrão, opcional.
- `category`: categoria, opcional.
- `brand`: marca, opcional.
- `size`: tamanho/grade, opcional na primeira versão.
- `color`: cor, opcional na primeira versão.
- `channel`: loja, web ou loja + web.
- `currentStock`: estoque em mãos.
- `reservedStock`: estoque reservado.
- `minimumStock`: regra de reposição.
- `costPrice`: custo.
- `salePrice`: preço de venda.
- `status`: ativo, inativo, baixo estoque, contagem, atraso fornecedor.
- `images`: assets WebP vinculados ao produto.

Formulário recomendado: ajuste de estoque.

Campos:

- `productId`: produto.
- `type`: entrada, saída ou correção.
- `quantity`: quantidade.
- `reason`: motivo.
- `reference`: referência opcional, como nota, pedido ou contagem.

Formulário recomendado: criação de pedido de compra a partir do plano de reposição.

Campos:

- `supplierId`: fornecedor.
- `items[]`: produtos e quantidades sugeridas.
- `expectedDeliveryAt`: previsão de entrega.
- `notes`: observações.

#### Tela `dashboard-local-store-management--suppliers-route`

Sinais visuais existentes:

- Botão principal: `Novo pedido`.
- Busca por fornecedor, pedido e nota.
- Tabela: fornecedor, pedido, entrega, valor, termos e status.
- Filtros: todos fornecedores, vence hoje, atrasados, a pagar, mais vendidos, novo fornecedor.
- Ações em massa: agendar recebimento, exportar notas, pedir novos termos.
- Painel lateral: fornecedor selecionado, pontualidade, valor aberto e lead time.
- Plano de entrega: ETA, caixas, recebedor e doca.
- Próximas ações: confirmar janela, conferir nota, etiquetar SKUs urgentes.

Formulário recomendado: cadastro/edição de fornecedor.

Campos:

- `name`: nome do fornecedor.
- `document`: CPF/CNPJ ou documento fiscal.
- `email`: e-mail comercial.
- `phone`: telefone/WhatsApp.
- `contactName`: contato principal.
- `category`: tipo de fornecimento, opcional.
- `leadTimeDays`: prazo médio.
- `paymentTerms`: termos padrão, exemplo à vista, 15, 30 ou 45 dias.
- `status`: ativo ou inativo.
- `notes`: observações internas.

Formulário recomendado: novo pedido de compra.

Campos:

- `supplierId`: fornecedor.
- `items[]`: produto, SKU, quantidade, custo unitário.
- `expectedDeliveryAt`: data/hora prevista.
- `paymentTerms`: termos negociados.
- `invoiceNumber`: nota fiscal, opcional na criação.
- `notes`: observações.

Formulário recomendado: recebimento de pedido.

Campos:

- `purchaseOrderId`: pedido de compra.
- `invoiceNumber`: nota fiscal.
- `receivedAt`: data/hora de recebimento.
- `receiverName`: responsável.
- `dock`: local de recebimento.
- `boxes`: volumes.
- `items[]`: quantidade esperada, recebida e divergência por SKU.
- `notes`: observações de conferência.

#### Tela `dashboard-local-store-management--orders-route`

Sinais visuais existentes:

- Botão principal: `Novo pedido`.
- Busca por pedido, cliente e SKU.
- Tabela: pedido, cliente, canal, total, prazo e status.
- Filtros: retirada pronta, separação, pagamento pendente, entrega e atrasados.
- Ações: imprimir recibo, marcar pronto e avisar cliente.
- Checklist de separação por item.

Este fluxo depende do catálogo de produtos já existir.

Formulário recomendado: novo pedido.

Campos:

- `customerId` ou dados rápidos do cliente.
- `channel`: loja, web, Pix, entrega.
- `items[]`: produto, SKU, quantidade e preço.
- `discount`: desconto opcional.
- `paymentMethod`: forma de pagamento.
- `pickupOrDelivery`: retirada ou entrega.
- `dueAt`: prazo/SLA.
- `notes`: observações.

### Lacunas entre telas e API atual

- [x] API in-memory já cobre cadastro básico de fornecedores.
- [x] API in-memory já cobre edição e exclusão de fornecedores.
- [x] API in-memory já cobre responsáveis de fornecedores.
- [x] API in-memory já cobre cadastro básico de produtos.
- [x] API in-memory já cobre ajuste simples de estoque.
- [x] API in-memory já prepara upload WebP de produto.
- [x] API já cobre `category`, `paymentTerm`, `deliveryTerm` e `notes` para fornecedor.
- [x] `contactName` foi substituído por `SupplierResponsible` reutilizável.
- [ ] API ainda precisa adicionar em produtos/estoque: `barcode`, `reservedStock`, `channel`, `category`, `brand`, `size` e `color`.
- [ ] API ainda precisa adicionar indicadores operacionais de fornecedor: `leadTimeDays`, pontualidade, valor aberto, atrasos e próximas entregas reais.
- [ ] API ainda precisa modelar pedido de compra (`PurchaseOrder`).
- [ ] API ainda precisa modelar recebimento de pedido de compra (`Receiving`).
- [ ] API ainda precisa modelar pedido/venda operacional (`Order`) usando produtos reais.
- [x] Backoffice já criou formulários de fornecedor e modal de responsáveis conectados à API.
- [ ] Backoffice ainda precisa criar drawers/formulários conectados para pedido de compra, recebimento e ações em massa.

## Estratégia Prisma/Postgres

### Regra de entrada

Não implementar Prisma/Postgres para uma funcionalidade antes de:

- [x] use case existir para recuperação de senha;
- [x] repositório in-memory existir para recuperação de senha;
- [x] testes de integração passarem usando in-memory para recuperação de senha;
- [x] teste de kill switch global passar para recuperação de senha;
- [x] contrato HTTP estar estável para todas as rotas públicas.

### Ordem recomendada

1. Finalizar funcionalidades públicas in-memory.
2. Adicionar Prisma e Postgres ao projeto.
3. Criar schema Prisma equivalente aos contratos testados.
4. Implementar repositórios Prisma atrás das mesmas interfaces de domínio.
5. Adicionar testes de integração específicos para persistência quando houver ambiente de banco.
6. Só então trocar wiring de produção para Prisma no `AppContainer`.

### Estrutura futura sugerida

- [x] `prisma/schema.prisma`
- [x] `src/core/infra/persistence/prisma/prisma-client.ts`
- [x] `src/core/infra/persistence/prisma/prisma-user-repository.ts`
- [x] `src/core/infra/persistence/prisma/prisma-password-recovery-repository.ts`
- [x] `src/core/infra/persistence/prisma/prisma-store-repository.ts`
- [x] `src/core/infra/persistence/prisma/prisma-onboarding-repository.ts`
- [x] `src/core/infra/persistence/prisma/index.ts`
- [x] `DATABASE_URL` em `.env.example`
- [x] `docker/compose.yml` com Postgres para desenvolvimento.
- [x] Adicionar testes de integração específicos contra Prisma/Postgres em ambiente de banco.
  - Testes opt-in via `RUN_PRISMA_INTEGRATION_TESTS=true`.

## Estratégia de erros

### Padrão adotado

- [x] Usar RFC 9457 Problem Details como formato base para erros HTTP.
- [x] Manter compatibilidade temporária com o formato atual (`error`, `message`, `details`, `traceId`).
- [x] Criar catálogo de erros com `code`, `acronym`, `level`, `category`, `status`, `title` e `type`.
- [x] Exportar tipos compartilháveis para o backoffice consumir respostas da API em telas globais e toasts.
- [x] Criar parser no backoffice para transformar erro HTTP em mensagem visual padronizada.

### Convenção de códigos

- Prefixo do produto: `TM`.
- Categoria curta: `AUTH`, `AUTHZ`, `VAL`, `DOM`, `FEAT`, `RES`, `SYS`.
- Status HTTP no sufixo: exemplo `TM-AUTH-401`, `TM-VAL-400`, `TM-SYS-500`.

### Níveis

- `info`: estado esperado ou operacional, como funcionalidade desligada por kill switch.
- `warning`: erro corrigível pelo usuário ou pela chamada, como validação, autenticação e autorização.
- `error`: falha de sistema sem ação imediata do usuário.
- `critical`: indisponibilidade grave ou risco operacional.

## Rotas públicas encontradas no Backoffice

| Rota | Tela | Status de API |
| --- | --- | --- |
| `/` | Redireciona para `/auth/login` | Não precisa de API |
| `/login` | Redireciona para `/auth/login` | Não precisa de API |
| `/auth/login` | Login público | Parcial: existe `POST /auth/login` |
| `/recover-password` | Solicitar recuperação de senha | In-memory: `POST /auth/password-recovery/request` |
| `/recover-password/code` | Validar código temporário | In-memory: `POST /auth/password-recovery/verify-code` e `POST /auth/password-recovery/resend-code` |
| `/recover-password/reset` | Redefinir senha | In-memory: `POST /auth/password-recovery/reset` |
| `/recover-password/success` | Confirmação visual | Não precisa de API própria |

## `/auth/register` + onboarding

### Decisões aplicadas

- [x] Cadastro público cria o usuário inicial da loja como `ROLE_COMPANY`.
- [x] Cadastro público não permite definir `role`.
- [x] Cadastro público não permite definir `accountStatus`.
- [x] Cadastro público cria progresso de onboarding com `nextStep = STORE_PROFILE`.
- [x] Rotas administrativas autenticadas continuam podendo criar `COMPANY`, `EMPLOYEE` e `DELIVERY_MAN` conforme regra de papel.

### API implementada in-memory

- [x] `GET /onboarding/me`
- [x] `POST /onboarding/store-profile`
- [x] `POST /onboarding/store-address`
- [x] `POST /onboarding/preferences`
- [x] `POST /onboarding/complete`

### Validações implementadas

- [x] Token obrigatório nas rotas de onboarding.
- [x] Kill switch `FEATURE_ONBOARDING_ENABLED`.
- [x] Nome da loja obrigatório com mínimo de 2 caracteres.
- [x] Telefone normalizado para dígitos e limitado a 10 ou 11 dígitos.
- [x] Documento normalizado para dígitos e limitado a CPF/CNPJ com 11 ou 14 dígitos.
- [x] Documento não pode pertencer a outra loja.
- [x] Segmento precisa pertencer ao enum `StoreSegment`.
- [x] Endereço só pode ser salvo depois de `STORE_PROFILE`.
- [x] Preferências só podem ser salvas depois de `STORE_ADDRESS`.
- [x] Onboarding só pode ser concluído depois de `STORE_PROFILE`, `STORE_ADDRESS` e `STORE_PREFERENCES`.
- [x] Rotas de onboarding aceitam autenticação por `Authorization: Bearer <token>` ou cookie `@thalya-modas:session`.

### Pendências para próxima etapa

- [x] Decidir se `ROLE_COMPANY` será mantido como dono/gerente da loja ou se criaremos `ROLE_MANAGER`.
- [x] Adicionar etapa de endereço.
- [x] Adicionar etapa de preferências operacionais.
- [x] Adicionar testes específicos para documento duplicado, telefone inválido e conclusão sem perfil.
- [x] Levar `Store` e `Onboarding` para Prisma/Postgres depois dos contratos estabilizarem.

## `/auth/login`

### Funcionalidades da tela

- Informar e-mail.
- Informar senha.
- Marcar/desmarcar “Remember me”.
- Entrar no dashboard ao autenticar.
- Acessar recuperação de senha.
- Ação visual de SSO seguro.

### API necessária

- [x] Revisar `POST /auth/login` para retornar payload compatível com o backoffice:
  - `user.id`
  - `user.name`
  - `user.email`
  - `user.role`
  - `user.accountStatus`
  - `token`
  - `expiresIn`
- [x] Adicionar seed para usuário de preview:
  - e-mail sugerido: `ana@thalyamodas.com`
  - senha sugerida: `Password123`
  - role de gerente/admin compatível com rotas `/manager/dashboard`.
- [x] Definir comportamento de “Remember me”:
  - receber `rememberMe?: boolean`
  - ampliar expiração do token quando verdadeiro, se aplicável.
- [x] Decidir se o backoffice usará token em resposta JSON ou cookie httpOnly.
  - Decisão: usar cookie `httpOnly` para sessão do backoffice.
  - Cookie padronizado: `@thalya-modas:session`.
  - `POST /auth/login` seta cookie seguro e o middleware lê o mesmo padrão.
- [x] Manter mensagens de erro genéricas para credenciais inválidas.

### Testes

- [x] Login com credenciais válidas retorna `200`, usuário, token e `expiresIn`.
- [x] Login com `rememberMe: true` retorna expiração maior.
- [x] Login com e-mail inexistente retorna `401`.
- [x] Login com senha incorreta retorna `401`.
- [x] Login com e-mail inválido retorna `400`.
- [x] Login com senha vazia retorna `400`.
- [x] Login de conta inativa/suspensa continua bloqueado.

## `/auth/login` - SSO seguro

### Funcionalidades da tela

- Botão “Continue with secure SSO”.
- Hoje é apenas ação visual; não há provedor configurado.

### API necessária

- [ ] Manter como pendente até existir provedor real.
- [ ] Opcional para preview: criar endpoint mock `POST /auth/sso/start`.

### Testes, se endpoint mock for criado

- [ ] Retorna `501` ou `202` com mensagem explícita de integração não configurada.
- [ ] Não cria sessão real sem provedor.

## `/recover-password`

### Funcionalidades da tela

- Informar e-mail usado no dashboard.
- Enviar código temporário.
- Voltar para login.

### API necessária

- [x] Criar `POST /auth/password-recovery/request`.
- [x] Body:
  - `email: string`
- [x] Comportamento:
  - normalizar e-mail.
  - se usuário existir e puder recuperar senha, criar código temporário.
  - armazenar em repositório in-memory de recuperação.
  - definir expiração de 10 minutos.
  - invalidar códigos anteriores do mesmo usuário/e-mail.
  - responder sempre de forma neutra para não revelar se o e-mail existe.
- [x] Para ambiente de teste/preview, permitir recuperar o código por meio controlado:
  - opção preferida: expor código apenas no repositório/factory de teste.
  - opção alternativa: retornar `debugCode` somente em `NODE_ENV=test`.

### Testes

- [x] Solicitação com e-mail válido existente retorna `202`.
- [x] Solicitação com e-mail válido inexistente retorna `202` sem criar reset utilizável.
- [x] Solicitação com e-mail inválido retorna `400`.
- [x] Nova solicitação invalida código anterior do mesmo e-mail.
- [x] Código gerado possui expiração de 10 minutos.

## `/recover-password/code`

### Funcionalidades da tela

- Digitar código de 6 dígitos.
- Confirmar código.
- Reenviar código após contagem regressiva.

### API necessária

- [x] Criar `POST /auth/password-recovery/verify-code`.
- [x] Body:
  - `email: string`
  - `code: string`
- [x] Response:
  - `resetToken: string`
  - `expiresIn: number`
- [x] Comportamento:
  - aceitar apenas código com 6 dígitos.
  - validar código ativo e não expirado.
  - limitar tentativas inválidas.
  - ao validar, gerar `resetToken` temporário.
  - marcar código como verificado/usado para evitar replay.
- [x] Criar `POST /auth/password-recovery/resend-code`.
- [x] Body:
  - `email: string`
- [x] Comportamento:
  - respeitar cooldown, inicialmente 30 segundos.
  - invalidar código anterior quando reenviar.

### Testes

- [x] Código válido retorna `200` com `resetToken`.
- [x] Código inválido retorna `401` ou `400`, conforme padrão da API.
- [x] Código expirado retorna erro.
- [x] Código já usado não pode ser reutilizado.
- [x] Após muitas tentativas inválidas, fluxo é bloqueado temporariamente.
- [x] Reenvio antes do cooldown retorna erro de regra de negócio.
- [x] Reenvio após cooldown cria novo código e invalida o anterior.

## `/recover-password/reset`

### Funcionalidades da tela

- Informar nova senha.
- Confirmar nova senha.
- Exibir requisito mínimo: 8 caracteres com número e letra maiúscula.
- Atualizar senha.

### API necessária

- [x] Criar `POST /auth/password-recovery/reset`.
- [x] Body:
  - `resetToken: string`
  - `password: string`
  - `passwordConfirmation: string`
- [x] Comportamento:
  - validar token temporário ativo e não expirado.
  - validar confirmação de senha.
  - validar regra de força mínima.
  - gerar hash da nova senha.
  - atualizar usuário no repositório in-memory.
  - invalidar todos os códigos/tokens pendentes daquele usuário.
  - opcional: retornar token de login automático ou exigir login manual.

### Testes

- [x] Reset com token válido e senhas iguais retorna `200`.
- [x] Senhas diferentes retornam `400`.
- [x] Senha fraca retorna `400`.
- [x] Token inválido retorna erro.
- [x] Token expirado retorna erro.
- [x] Token já usado não pode ser reutilizado.
- [x] Após reset, login com senha antiga falha.
- [x] Após reset, login com senha nova funciona.

## `/recover-password/success`

### Funcionalidades da tela

- Confirmar que a senha foi atualizada.
- Voltar para dashboard.
- Voltar para login.

### API necessária

- [ ] Nenhuma rota própria.
- [ ] Depende do sucesso de `POST /auth/password-recovery/reset`.

### Testes

- [x] Coberto indiretamente pelos testes de reset.

## Estrutura sugerida na API

- [x] `src/core/domain/entities/password-recovery.ts`
- [x] `src/core/domain/repositories/password-recovery-repository.ts`
- [x] `src/core/application/use-cases/auth/password-recovery.ts`
- [x] `src/core/infra/persistence/in-memory/in-memory-password-recovery-repository.ts`
- [x] Atualizar `src/app/http/routes/auth.routes.ts`
- [x] Atualizar `src/app/http/container.ts`
- [x] Criar testes em `tests/integration/auth/password-recovery.spec.ts`

## Ordem recomendada de implementação

1. Ajustar/seedar login público para preview.
2. Criar entidade/repositório in-memory de recuperação de senha.
3. Implementar solicitação de recuperação.
4. Implementar validação de código e reenvio.
5. Implementar reset de senha.
6. Cobrir fluxo completo com teste de integração ponta a ponta.
