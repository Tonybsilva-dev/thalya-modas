FROM postgres:17-alpine AS postgres-base

LABEL org.opencontainers.image.title="Thalya Modas Postgres"
LABEL org.opencontainers.image.description="Postgres service for local and production-like environments."

FROM postgres-base AS development

COPY ./initdb /docker-entrypoint-initdb.d

FROM postgres-base AS production

COPY ./initdb /docker-entrypoint-initdb.d
