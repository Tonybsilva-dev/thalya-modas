import { z } from 'zod';
import { createUserSchema } from '../../../core/domain/schemas/user.schema';
import {
	createRequestSchema,
	createResponseSchema,
} from '../../../shared/utils/zod-to-json-schema';

// Exemplo de schemas para query e params
const getUserQuerySchema = z.object({
	includeDeleted: z.boolean().optional().default(false),
});

const getUserParamsSchema = z.object({
	id: z.string().uuid(),
});

// Exemplo de resposta usando schema de domínio
const userResponseSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	email: z.string().email(),
	role: z.string(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

/**
 * Exemplo de rotas demonstrando o uso de schemas Zod com Swagger automático
 * Este arquivo serve como referência para criar novas rotas
 */
// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
export async function exampleRoutes(fastify: any) {
	// Exemplo: GET com query params e path params
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).get(
		'/users/:id',
		{
			schema: {
				description: 'Busca um usuário por ID',
				tags: ['users'],
				params: createRequestSchema({ params: getUserParamsSchema }).params,
				querystring: createRequestSchema({ query: getUserQuerySchema })
					.querystring,
				response: {
					200: createResponseSchema(userResponseSchema, 'Usuário encontrado'),
					404: createResponseSchema(
						z.object({ message: z.string() }),
						'Usuário não encontrado',
					),
				},
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any) => {
			// TypeScript sabe os tipos automaticamente!
			const { id } = request.params;
			// const { includeDeleted } = request.query; // TODO: usar quando implementar lógica

			// TODO: Implementar lógica real
			return {
				id,
				name: 'John Doe',
				email: 'john@example.com',
				role: 'ROLE_CUSTOMER',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
		},
	);

	// Exemplo: POST com body usando schema de domínio
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).post(
		'/users',
		{
			schema: {
				description: 'Cria um novo usuário',
				tags: ['users'],
				body: createRequestSchema({ body: createUserSchema }).body,
				response: {
					201: createResponseSchema(
						userResponseSchema,
						'Usuário criado com sucesso',
					),
					400: createResponseSchema(
						z.object({
							error: z.string(),
							message: z.string(),
							details: z.array(z.unknown()).optional(),
						}),
						'Erro de validação',
					),
				},
			},
		},
		async (request: {
			body: { name: string; email: string; password: string; role: string };
		}) => {
			// TypeScript valida automaticamente o body!
			const { name, email, role } = request.body;
			// const { password } = request.body; // TODO: usar quando implementar hash

			// TODO: Implementar lógica real
			return {
				id: crypto.randomUUID(),
				name,
				email,
				role,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
		},
	);
}
