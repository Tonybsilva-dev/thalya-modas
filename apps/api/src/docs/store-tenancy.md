# Isolamento operacional por loja

Status: Fases 1 e 2 concluídas; Fases 3 e 4 pendentes.

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
4. anexar `{ userId, storeId, role }` ao contexto da requisição.

Durante a transição, contas com exatamente uma loja usam essa loja como
fallback. Contas sem loja recebem `403`; contas com mais de uma loja e sem o
header recebem `400`. O fallback deve ser removido quando o seletor de lojas
estiver disponível.

## Tabelas a migrar

- `suppliers`
- `supplier_responsibles`
- `products`
- `product_image_assets`
- `inventory_movements`
- `purchase_orders`
- `purchase_order_items`
- `receivings`

Índices únicos atualmente baseados em `userId` passam a usar `storeId`, por
exemplo:

- `Supplier`: `@@unique([storeId, document])`
- `Product`: `@@unique([storeId, sku])`
- `PurchaseOrder`: `@@unique([storeId, code])`

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

- adicionar `storeId` inicialmente opcional às tabelas operacionais;
- preencher pelo proprietário atual;
- verificar que não restaram valores nulos ou ambíguos;
- trocar índices únicos para o escopo da loja;
- tornar `storeId` obrigatório.

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
As colunas operacionais continuam baseadas em `userId` até a Fase 3.
