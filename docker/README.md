# Docker local

O Store Flow usa por padrão o PostgreSQL 16 existente do TrinketOS:

- Container: `as-trinketos-postgres-1`
- Host: `localhost:5433`
- Base: `store-flow` (separada da base `trinketos`)
- Volume gerenciado pelo TrinketOS: `as-trinketos_postgres_data`

```sh
pnpm docker:postgres:up
pnpm db:deploy
pnpm dev:api
pnpm dev:backoffice
```

`docker:postgres:up` apenas inicia o container existente. Se ele não existir,
o comando falha: a infraestrutura deve ser provisionada pelo TrinketOS.
`docker:postgres:logs` acompanha esse mesmo container. Não pare ou remova o
banco compartilhado pelo fluxo do Store Flow.

A API roda no host, na porta 3333, e o backoffice na 3001. Configure
`apps/api/.env` a partir do exemplo:

```env
PERSISTENCE_DRIVER="postgres"
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/store-flow?schema=public"
```

Essas credenciais são apenas para desenvolvimento local. Redis e RabbitMQ
não são dependências atuais da API. Caso sejam incorporados, use prefixos de
chaves próprios no Redis e um vhost próprio no RabbitMQ compartilhado.

## Alternativa isolada

`docker/compose.yml` e `postgres/` permanecem como alternativa explícita:

```sh
pnpm docker:postgres:isolated:up
pnpm docker:postgres:isolated:down
```

Essa alternativa cria PostgreSQL 17 na porta 5432, com a base `store_flow`.
Ela exige alterar a URL da API para as credenciais desse Compose. Não é usada
no fluxo compartilhado padrão. A documentação de `postgres/README.md` descreve
somente essa alternativa.
