# Docker

Estrutura centralizada para serviços de infraestrutura e runtime do monorepo.

## Estrutura

```txt
docker/
  compose.yml
  postgres/
    Dockerfile
    README.md
    initdb/
      001-extensions.sql
```

Cada pasta dentro de `docker/` representa um serviço. Serviços com build próprio devem expor estágios no `Dockerfile`, como `development` e `production`.

## Postgres

Subir apenas o banco:

```sh
pnpm docker:postgres:up
```

Ver logs:

```sh
pnpm docker:postgres:logs
```

Parar o banco:

```sh
pnpm docker:postgres:down
```

String local para Prisma/API:

```env
DATABASE_URL="postgresql://thalya:thalya_dev_password@localhost:5432/thalya_modas?schema=public"
```

Variaveis aceitas pelo compose:

```env
POSTGRES_USER=thalya
POSTGRES_PASSWORD=thalya_dev_password
POSTGRES_DB=thalya_modas
POSTGRES_PORT=5432
```
