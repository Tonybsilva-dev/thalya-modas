# Boilerplate: Backend Node com Fastify, DDD e RBAC

## Objetivo

Criar um backend Node pronto para produção, com uma estrutura padrão que possa ser reutilizada em qualquer projeto, aplicando as diretrizes da agência:

- DDD (Domain-Driven Design).
- Fastify como HTTP server.
- Padrão Factory para testes.
- Testes unitários e de integração com Vitest.
- Biome para lint/format.
- Tratativa de erros estruturada.
- Padrões de paginação encapsulados.
- Health-check detalhado.
- Middlewares reusáveis.
- RBAC com CASL para 2 tipos de usuário.
- Documentação de API com Swagger (OpenAPI).
- Autenticação pronta (base JWT ou session token).
- Pipeline/ação para atualizar dependências com segurança.

> **Assunção:** este boilerplate usa **TypeScript** e **npm**. Adapte para `pnpm`/`yarn` se desejar.

---

## 1. Inicialização do projeto

1. **Criar pasta do projeto**

   ```bash
   mkdir my-service && cd my-service
   ```

2. **Inicializar `package.json`**

   ```bash
   npm init -y
   ```

3. **Adicionar TypeScript e tipos básicos**

   ```bash
   npm install -D typescript ts-node @types/node
   npx tsc --init
   ```

4. **Configurar `tsconfig.json` (base sugerida)**
   - `rootDir`: `src`
   - `outDir`: `dist`
   - `moduleResolution`: `node`
   - `strict`: `true`

---

## 2. Instalação das dependências principais

### 2.1 Dependências de runtime

```bash
npm install fastify @fastify/swagger @fastify/swagger-ui
npm install jsonwebtoken bcryptjs
npm install @casl/ability
npm install zod
```

> Ajustar libs de auth conforme necessidade (ex.: OAuth, provider externo etc.).

### 2.2 Dependências de desenvolvimento

```bash
npm install -D vitest @vitest/coverage-v8
npm install -D tsx
npm install -D @biomejs/biome
npm install -D cross-env
npm install -D npm-check-updates
```

Opcional para testes de integração HTTP:

```bash
npm install -D supertest
```

---

## 3. Estrutura de pastas (DDD simplificado)

Sugestão de estrutura:

```text
src/
  app/
    http/
      routes/
      middlewares/
      controllers/
      errors/
      healthcheck/
  core/
    domain/
      entities/
      value-objects/
      services/
      events/
    application/
      use-cases/
      dto/
    infra/
      http/
      persistence/
      auth/
      logging/
  shared/
    config/
    env/
    utils/
    pagination/
    rbac/

tests/
  unit/
  integration/
```

- **`core/domain`**: regras de negócio puras, sem dependência de frameworks.
- **`core/application`**: casos de uso, orquestram domínios e infra.
- **`core/infra`**: implementação concreta (Fastify, DB, cache, etc.).
- **`app/http`**: camada de entrega (rotas, controllers, middlewares).
- **`shared`**: utilidades comuns (config, pagination, RBAC, helpers).

---

## 4. Configuração do servidor Fastify

Criar `src/app/http/server.ts` com bootstrap do Fastify, registro de plugins, rotas e Swagger.

Pontos principais a garantir:

- Registrar `@fastify/swagger` e `@fastify/swagger-ui`.
- Registrar rotas por domínio (ex.: `authRoutes`, `userRoutes`).
- Registrar middleware de erro global.
- Expor rota de health-check.

Scripts no `package.json`:

```jsonc
{
  "scripts": {
    "dev": "tsx watch src/app/http/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/app/http/server.js"
  }
}
```

---

## 5. Tratativa de erros estruturada

1. Criar uma hierarquia de erros em `src/app/http/errors/` (por exemplo, `AppError`, `DomainError`, `ValidationError`, `AuthError`).
2. Criar um **middleware de erro global** que:
   - Converte erros conhecidos em respostas HTTP com `statusCode` e `body` padronizado.
   - Loga internamente erros inesperados.
   - Não vaza stack trace em produção.
3. Definir um formato de resposta de erro (exemplo):

```jsonc
{
  "error": "ValidationError",
  "message": "E-mail inválido",
  "details": [{ "field": "email", "rule": "email" }],
  "traceId": "<uuid>"
}
```

Esse contrato deve ser documentado no Swagger.

---

## 6. Padrões de paginação encapsulados

Criar em `src/shared/pagination/`:

- Um tipo/DTO de entrada (por exemplo, `PageRequest` com `page`, `perPage`, `sort`, `filter`).
- Um tipo de saída (por exemplo, `Page<T>` com `items`, `total`, `page`, `perPage`).
- Helpers para converter query string em `PageRequest`.
- Política padrão de limites (ex.: `perPage` máximo 100).

Todas as rotas que retornam listas devem usar esses tipos.

---

## 7. Health-check detalhado

Criar módulo `src/app/http/healthcheck/` com:

- Rota `GET /health` retornando:
  - status do servidor.
  - version/build.
  - timestamp.
- Opcional: rota `GET /health/deep` testando conexões externas (DB, cache, filas, etc.).

Formato sugerido:

```jsonc
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 123.45,
  "checks": {
    "database": "ok",
    "cache": "ok"
  }
}
```

---

## 8. Middlewares

Organizar middlewares em `src/app/http/middlewares/`:

- **Logger** (pode usar o próprio logger do Fastify).
- **Request ID / Trace ID** para correlação de logs.
- **Auth** (extrai token, valida e injeta `currentUser` no request).
- **RBAC** (verifica permissões usando CASL).
- **Validation** (usando **Zod** como padrão para validar `body`, `query`, `params` e `headers`).

Todos devem ser registrados via plugins do Fastify.

### 8.1 Validações com Zod (SOLID + reaproveitamento)

- **Princípios**:
  - Cada schema deve ter uma responsabilidade clara (Single Responsibility).
  - Schemas de domínio não devem conhecer detalhes de transporte (HTTP), apenas os tipos necessários.
  - Evitar duplicação: preferir `z.object()`, `z.union()`, `z.intersection()` e `schema.merge(...)` para compor validações.
- **Padrões recomendados**:
  - Criar schemas em módulos reutilizáveis, por exemplo `src/core/application/dto` ou `src/shared/validation`.
  - Reutilizar partes de schemas entre:
    - DTOs de entrada (use-cases).
    - Validações de rotas HTTP.
    - Validação de env (`src/shared/env`) quando fizer sentido.
  - Exemplo de composição:

    ```ts
    const baseUserSchema = z.object({
      email: z.string().email(),
      name: z.string().min(2),
    })

    const createUserSchema = baseUserSchema.merge(
      z.object({
        password: z.string().min(8),
      }),
    )

    const updateUserSchema = baseUserSchema.partial()
    ```

  - As rotas devem apenas **consumir** esses schemas (nada de criar schema inline em todo lugar), garantindo reaproveitamento e facilidade de manutenção.

---

## 9. RBAC com CASL (2 tipos de usuário)

Cenário padrão:

- `ROLE_USER`
- `ROLE_ADMIN`

Passos:

1. Modelar um tipo `User` com `id`, `role` e claims relevantes.
2. Criar `AbilityFactory` em `src/shared/rbac/ability-factory.ts` que recebe o usuário e retorna uma instância CASL com as permissões.
3. Criar um middleware/guard que, por rota, verifique se o usuário tem permissão para a ação pretendida (ex.: `manage`, `read`, `update`, etc.).
4. Documentar o comportamento no Swagger (códigos 403/401, roles, escopos se aplicável).

---

## 10. Autenticação

Objetivo: sistema de autenticação pronto para uso básico.

Sugestão mínima:

- Rota `POST /auth/register`.
- Rota `POST /auth/login` retornando token JWT.
- Rota `GET /auth/me` retornando usuário atual.

Checklist:

- Armazenar senhas com `bcrypt` (hash + salt).
- Configurar segredo JWT via env.
- Ter tempo de expiração configurável.
- Possível refresh token como evolução futura.

---

## 11. Testes (unitários e integração)

### 11.1 Configuração Vitest

Adicionar no `package.json`:

```jsonc
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:changed": "vitest related --changed --run",
    "test:coverage": "vitest run --coverage"
  }
}
```

Criar arquivo de config `vitest.config.ts` com:

- `testEnvironment`: `node`.
- `include`: `["tests/**/*.{test,spec}.{js,ts}"]` - define quais arquivos serão testados.
- `exclude`: lista de pastas/arquivos a ignorar (node_modules, dist, configs, etc.).
- `coverage`: configuração de cobertura de código:
  - `provider`: `"v8"` - usa o provider v8 para coverage.
  - `reporter`: `["text", "json", "html"]` - formatos de relatório.
  - `exclude`: arquivos/pastas a excluir do coverage (tests, configs, docs, index.ts, etc.).
  - `include`: `["src/**/*.{js,ts}"]` - apenas código fonte em `src/`.
  - `thresholds`: limites mínimos de cobertura (lines: 80%, functions: 80%, branches: 75%, statements: 80%).
- Paths de alias se necessário.
- Setup para limpar DB entre testes de integração (se tiver DB).

**Scripts disponíveis:**

- `npm test` - roda testes em modo watch.
- `npm run test:ui` - abre interface gráfica do Vitest para visualizar e debugar testes.
- `npm run test:changed` - roda apenas testes relacionados a arquivos modificados (usado no QA).
- `npm run test:coverage` - gera relatório de cobertura de código.

### 11.2 Factory pattern para testes

Criar `tests/factories/` com fábricas para entidades e objetos comuns:

- `makeUser`, `makeAuthToken`, `makePaginationRequest`, etc.

Objetivo: reduzir duplicação e tornar testes mais legíveis.

### 11.3 Repository pattern para testes

Implementar mocks de repositórios seguindo o padrão Repository para isolar testes de casos de uso e serviços de domínio.

**Estrutura sugerida:**

```text
src/core/domain/repositories/
  └── user-repository.ts          # Interface do repositório

tests/unit/core/domain/repositories/
  ├── mock-user-repository.ts     # Implementação mock
  └── mock-user-repository.spec.ts # Testes do mock
```

**Exemplo de interface:**

```typescript
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>;
  update(id: string, user: Partial<...>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}
```

**Exemplo de mock:**

```typescript
export class MockUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();
  
  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }
  
  // ... implementar outros métodos
}
```

**Benefícios:**

- Isola testes de casos de uso sem dependência de infraestrutura real (DB, APIs).
- Permite simular cenários específicos (usuário não encontrado, duplicação de email, etc.).
- Testes determinísticos e rápidos.
- Facilita testes de edge cases e erros.

---

## 12. Biome (lint + format)

1. Inicializar Biome:

   ```bash
   npx biome init
   ```

2. Ajustar config para TypeScript/Node.

3. Adicionar scripts no `package.json`:

```jsonc
{
  "scripts": {
    "lint": "biome lint .",
    "format": "biome format .",
    "check": "biome check ."
  }
}
```

Integrar com CI para impedir merge com lint quebrado.

---

## 13. Husky + lint-staged + script de QA

Objetivo: garantir que **todo commit** passe por um script de QA que roda:

- lint (Biome)
- format (Biome)
- testes (Vitest) **apenas nos arquivos modificados**

### 13.1 Instalar Husky e lint-staged (modelo atual)

1. **Instalar dependências de desenvolvimento**

   ```bash
   npm install --save-dev husky lint-staged
   ```

2. **Adicionar script `prepare` no `package.json`**

   Esse script garante que o Husky será configurado após `npm install`:

   ```jsonc
   {
     "scripts": {
       "prepare": "husky || true"
     }
   }
   ```

3. **Inicializar Husky**

   ```bash
   npx husky init
   ```

   O comando acima:
   - cria a pasta `.husky/`
   - adiciona um hook `pre-commit` inicial
   - ajusta o `package.json` para usar o `prepare` (se ainda não existir)

### 13.2 Scripts de QA no `package.json`

No `package.json`, ajustar/add:

```jsonc
{
  "scripts": {
    "lint": "biome lint .",
    "format": "biome format .",
    "check": "biome check .",
    "test": "vitest",
    "test:changed": "vitest related --changed --runInBand",
    "qa": "npm run lint && npm run format && npm run test:changed"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "biome lint",
      "biome format"
    ],
    "**/*.{test,spec}.{ts,tsx,js,jsx}": [
      "vitest related --runInBand"
    ]
  }
}
```

> Aqui o `qa` é o script completo para ser usado em CI ou manualmente, e o `lint-staged` garante que apenas arquivos alterados sejam checados no pre-commit.

### 13.3 Hook `pre-commit` chamando lint-staged

No arquivo `.husky/pre-commit` (criado pelo `npx husky init`), ajustar para:

```bash
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

Assim, sempre que você fizer `git commit`, o Husky executa o `lint-staged`, que rodará o lint/format e os testes apenas nos arquivos modificados.

---

## 14. Swagger (OpenAPI)

1. Registrar `@fastify/swagger` e `@fastify/swagger-ui` no servidor.
2. Definir metadados básicos da API: título, descrição, versão, servers.
3. Documentar:
   - Rotas de auth.
   - Rotas principais de domínio.
   - Formato de erros.
   - Esquemas de paginação.
   - Esquema de segurança (Bearer JWT, por exemplo).

Disponibilizar UI em `/docs` ou `/swagger`.

---

## 15. Gestão de variáveis de ambiente

Criar `src/shared/env/` com carregamento e validação de env (idealmente com uma lib de schema, como Zod):

- `NODE_ENV`
- `PORT`
- `JWT_SECRET`
- `DATABASE_URL` (se houver DB)

Não permitir start em produção sem env obrigatórias.

---

## 16. Atualização segura de dependências

### 15.1 Script local com `npm-check-updates`

1. Adicionar script no `package.json`:

```jsonc
{
  "scripts": {
    "deps:check": "npx npm-check-updates",
    "deps:update": "npx npm-check-updates -u && npm install"
  }
}
```

2. Política de uso:
   - Rodar `npm run deps:check` mensalmente.
   - Quando atualizar, sempre rodar:
     - `npm test`
     - `npm run lint`
     - `npm run build`

### 15.2 Ações de CI (ex.: GitHub Actions)

- Workflow que:
  - Em PRs de atualização de dependência, roda `npm install`, `npm run lint`, `npm test`, `npm run build`.
  - Só permite merge se tudo estiver verde.

> Este boilerplate pode ter um arquivo `.github/workflows/ci.yml` padrão adicionando esses passos.

---

## 17. Checklist de criação de novo backend com este template

Sempre que criar um novo projeto backend:

1. **Clonar o template** ou copiar esta estrutura de pastas.
2. Atualizar `package.json` (nome, versão, descrição, repositório).
3. Configurar `tsconfig.json` (paths, strict mode, etc.).
4. Configurar envs (`.env.example`).
5. Ajustar módulos de domínio inicial (ex.: `users`, `auth`, `organizations`).
6. Configurar RBAC inicial (perfis e abilities no CASL).
7. Ajustar rotas base (`/health`, `/auth/*`, qualquer domínio core).
8. Configurar Swagger com título/descrição do projeto.
9. Rodar pipeline local: `npm run lint`, `npm test`, `npm run build`.
10. Configurar CI e actions de atualização de dependências.

A partir deste documento, qualquer novo backend deve seguir este fluxo, garantindo consistência entre projetos.
