# Isolamento operacional por loja

Status: Fases 1, 2 e 3 concluídas; Fase 4 pendente.

## Problema atual

Os registros operacionais de catálogo são filtrados por `userId`. Esse desenho
funciona para o proprietário único usado no preview, mas cria duas limitações:

- funcionários autenticados não compartilham automaticamente os dados da loja;
- um proprietário com mais de uma loja não consegue selecionar qual contexto
  operacional está usando.

`userId` deve continuar existindo como ator/auditoria, mas não deve representar
o tenant dos dados.

## Invariantes

1. Todo dado operacional pertence a exatamente uma `Store`.
2. Todo acesso exige que o usuário seja proprietário ou membro ativo da loja.
3. `userId` registra quem criou ou alterou o dado; `storeId` determina
   isolamento e unicidade.
4. O cliente nunca ganha acesso apenas por enviar um `storeId`; a associação
   deve ser validada no servidor.
5. Rotas sem uma loja ativa retornam erro controlado antes de consultar um
   repositório operacional.
6. Cada loja possui `slug` e `bucketKey` únicos e imutáveis. Todo objeto no R2
   usa `bucketKey` como prefixo, isolando os arquivos por tenant.

## Modelo implementado

Adicionar `StoreMembership`:

```prisma
model StoreMembership {
  id        String   @id @default(uuid())
  storeId   String
  userId    String
  role      String
  status    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([storeId, userId])
  @@index([userId, status])
}
```

O proprietário recebe uma associação ativa durante o onboarding. Funcionários
serão associados explicitamente por um fluxo administrativo.

## Transporte da loja ativa

O backoffice envia `X-Store-Id` automaticamente quando o cookie de última loja
está disponível no navegador. Um header definido explicitamente pelo chamador
tem precedência.

O middleware da API:

1. autenticar o usuário;
2. ler `X-Store-Id`;
3. validar propriedade ou associação ativa;
4. anexar `{ userId, storeId, storeSlug, storeBucketKey, role }` ao contexto da
   requisição.

Durante a transição, contas com exatamente uma loja usam essa loja como
fallback. Contas sem loja recebem `403`; contas com mais de uma loja e sem o
header recebem `400`. O fallback deve ser removido quando o seletor de lojas
estiver disponível.

## Tabelas migradas

- `suppliers`
- `supplier_responsibles`
- `products`
- `product_image_assets`
- `inventory_movements`
- `purchase_orders`
- `purchase_order_items`
- `receivings`

Os índices únicos baseados em `userId` passaram a usar `storeId`:

- `Supplier`: `@@unique([storeId, document])`
- `Product`: `@@unique([storeId, sku])`
- `PurchaseOrder`: `@@unique([storeId, code])`

## Identidade de armazenamento no R2

O onboarding gera um slug normalizado e globalmente único ao criar a loja. O
prefixo oficial é persistido em `stores.bucket_key` no formato
`stores/{slug}`. Por exemplo:

```text
store-flow/
└── stores/thalya-modas/
    └── products/{productId}/{assetId}.webp
```

Renomear a loja não altera o slug nem move seus objetos. O contrato de update
não aceita `slug` ou `bucketKey`, e uma trigger no PostgreSQL rejeita alterações
diretas nesses campos. Uma constraint também garante que
`bucket_key = 'stores/' || slug`.

## Sequência segura de rollout

### Fase 1 — Associação

- [x] criar `StoreMembership`;
- [x] criar associação do proprietário no onboarding;
- [x] popular associações para proprietários existentes;
- [x] implementar consulta de acesso à loja e seus testes.

### Fase 2 — Contexto HTTP

- [x] aceitar e validar `X-Store-Id`;
- [x] enviar o header pelo backoffice;
- [x] manter fallback temporário para a única loja acessível;
- [x] validar propriedade ou associação ativa antes das rotas operacionais;
- [x] cobrir fallback, ambiguidade, acesso negado e membership no PostgreSQL.

### Fase 3 — Colunas e backfill

- [x] adicionar `storeId` inicialmente opcional às tabelas operacionais;
- [x] resolver uma única loja acessível para registros raiz existentes;
- [x] propagar a loja pelas relações pai-filho;
- [x] abortar a migration em caso de dados nulos, ambíguos ou cruzados;
- [x] trocar índices únicos para o escopo da loja;
- [x] tornar `storeId` obrigatório e adicionar chaves estrangeiras;
- [x] preencher novas gravações com o contexto validado da Fase 2.

### Fase 4 — Repositórios

- substituir filtros de tenant baseados em `userId` por `storeId`;
- manter `userId` apenas como ator;
- executar os mesmos testes de contrato contra in-memory e Prisma;
- remover o fallback de loja quando o seletor estiver disponível.

## Auditoria local de 2026-07-30

A auditoria utilizou somente contagens:

- 3 usuários;
- 1 loja;
- nenhum usuário com dados de catálogo sem loja associável;
- nenhum proprietário com múltiplas lojas.

O backfill de associações foi aplicado na Fase 1. O contexto HTTP da Fase 2
impede que a seleção enviada pelo cliente seja aceita sem validação no servidor.
Na Fase 3, as oito tabelas operacionais receberam `storeId` obrigatório. Os
filtros continuam combinando `userId` e `storeId` durante a transição; a Fase 4
remove `userId` do isolamento e o mantém apenas como ator/auditoria.
