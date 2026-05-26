# HTTP Layer - Fastify com Zod

Esta camada contém a configuração do servidor HTTP usando Fastify, com integração automática do Swagger usando schemas Zod.

## 🎯 Como Funciona

### 1. Schemas Zod → Swagger Automático

Os schemas Zod definidos no domínio são automaticamente convertidos para JSON Schema (OpenAPI) e aparecem na documentação Swagger.

**Exemplo:**

```typescript
import { z } from 'zod';
import { createRequestSchema, createResponseSchema } from '../../../shared/utils/zod-to-json-schema';
import { createUserSchema } from '../../../core/domain/schemas/user.schema';

fastify.post<{ Body: z.infer<typeof createUserSchema> }>(
  '/users',
  {
    schema: {
      description: 'Cria um novo usuário',
      tags: ['users'],
      body: createRequestSchema({ body: createUserSchema }).body,
      response: {
        201: createResponseSchema(userResponseSchema, 'Usuário criado'),
      },
    },
  },
  async (request) => {
    // TypeScript valida automaticamente!
    const { name, email, password } = request.body;
    // ...
  }
);
```

### 2. Helpers Disponíveis

#### `zodToJsonSchemaFastify(schema, options?)`
Converte um schema Zod para JSON Schema compatível com OpenAPI 3.1.

#### `createResponseSchema(schema, description?)`
Cria um schema de resposta padronizado para Fastify.

#### `createRequestSchema(options?)`
Cria schemas de request (body, query, params, headers) de forma padronizada.

### 3. Estrutura de Rotas

```typescript
// src/app/http/routes/user.routes.ts
export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/users', { schema: { ... } }, async (request, reply) => {
    // Handler
  });
}
```

### 4. Registro de Rotas

No `server.ts`:

```typescript
await server.register(userRoutes);
await server.register(authRoutes);
```

## 📚 Benefícios

✅ **Type Safety**: TypeScript valida automaticamente os tipos
✅ **Validação Automática**: Fastify valida requests usando os schemas Zod
✅ **Documentação Automática**: Swagger gera a documentação automaticamente
✅ **Reutilização**: Mesmos schemas usados no domínio e na validação HTTP
✅ **Manutenibilidade**: Mudanças nos schemas refletem automaticamente na API

## 🔄 Fluxo Completo

1. **Definir schema no domínio** (`core/domain/schemas/user.schema.ts`)
2. **Usar na rota** com `createRequestSchema` ou `createResponseSchema`
3. **Swagger gera automaticamente** a documentação
4. **Fastify valida automaticamente** os requests
5. **TypeScript garante type safety** em tempo de compilação

## 📖 Exemplos

Veja `routes/example.routes.ts` para exemplos completos de uso.

