# Postgres

Servico de banco de dados para desenvolvimento local.

## Estagios

- `development`: usado pelo `docker/compose.yml` local.
- `production`: reservado para composicoes futuras com configuracoes de runtime mais restritas.

## Banco padrao

- Host local: `localhost`
- Porta: `5432`
- Usuario: `thalya`
- Senha: `thalya_dev_password`
- Database: `thalya_modas`

## Prisma

Use a URL abaixo no `.env` da API quando o Prisma for adicionado:

```env
DATABASE_URL="postgresql://thalya:thalya_dev_password@localhost:5432/thalya_modas?schema=public"
```
