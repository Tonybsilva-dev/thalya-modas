import { z } from 'zod';
import {
	createRequestSchema,
	createResponseSchema,
} from '../../../shared/utils/zod-to-json-schema';
import { AuthError } from '../errors/auth-error';
import { DomainError } from '../errors/domain-error';
import { ForbiddenError } from '../errors/forbidden-error';
import { NotFoundError } from '../errors/not-found-error';
import { ValidationError } from '../errors/validation-error';

/**
 * Rotas de exemplo demonstrando o tratamento de erros estruturado
 * Útil para testar e documentar os diferentes tipos de erro
 */
// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
export async function errorExampleRoutes(fastify: any) {
	// Exemplo: ValidationError (erro de validação Zod)
	const validationBodySchema = z.object({ email: z.string().email() });
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).post(
		'/errors/validation',
		{
			schema: {
				description: 'Exemplo de erro de validação',
				tags: ['errors'],
				body: createRequestSchema({
					body: validationBodySchema,
				}).body,
				response: {
					400: createResponseSchema(
						z.object({
							error: z.string(),
							message: z.string(),
							details: z.array(z.unknown()),
							traceId: z.string(),
						}),
						'Erro de validação',
					),
				},
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any) => {
			// Simula validação que falha
			const schema = z.object({
				email: z.string().email(),
				age: z.number().int().positive(),
			});

			try {
				schema.parse(request.body);
			} catch (error) {
				if (error instanceof z.ZodError) {
					throw ValidationError.fromZodError(error, {
						traceId: request.traceId,
					});
				}
				throw error;
			}

			return { success: true };
		},
	);

	// Exemplo: DomainError
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).get(
		'/errors/domain',
		{
			schema: {
				description: 'Exemplo de erro de domínio',
				tags: ['errors'],
				response: {
					400: createResponseSchema(
						z.object({
							error: z.string(),
							message: z.string(),
							traceId: z.string(),
						}),
						'Erro de domínio',
					),
				},
			},
		},
		async (request: { traceId?: string }) => {
			throw new DomainError('Regra de negócio violada', {
				details: { reason: 'Exemplo de violação de regra' },
				traceId: request.traceId,
			});
		},
	);

	// Exemplo: AuthError
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).get(
		'/errors/auth',
		{
			schema: {
				description: 'Exemplo de erro de autenticação',
				tags: ['errors'],
				response: {
					401: createResponseSchema(
						z.object({
							error: z.string(),
							message: z.string(),
							traceId: z.string(),
						}),
						'Erro de autenticação',
					),
				},
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any) => {
			throw new AuthError('Token inválido ou expirado', {
				traceId: request.traceId,
			});
		},
	);

	// Exemplo: ForbiddenError
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).get(
		'/errors/forbidden',
		{
			schema: {
				description: 'Exemplo de erro de autorização',
				tags: ['errors'],
				response: {
					403: createResponseSchema(
						z.object({
							error: z.string(),
							message: z.string(),
							traceId: z.string(),
						}),
						'Erro de autorização',
					),
				},
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any) => {
			throw new ForbiddenError('Acesso negado a este recurso', {
				traceId: request.traceId,
			});
		},
	);

	// Exemplo: NotFoundError
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).get(
		'/errors/not-found',
		{
			schema: {
				description: 'Exemplo de erro de recurso não encontrado',
				tags: ['errors'],
				response: {
					404: createResponseSchema(
						z.object({
							error: z.string(),
							message: z.string(),
							traceId: z.string(),
						}),
						'Recurso não encontrado',
					),
				},
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any) => {
			throw new NotFoundError('Usuário não encontrado', {
				details: { resource: 'user', id: '123' },
				traceId: request.traceId,
			});
		},
	);

	// Exemplo: Erro genérico (InternalServerError)
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).get(
		'/errors/internal',
		{
			schema: {
				description: 'Exemplo de erro interno do servidor',
				tags: ['errors'],
				response: {
					500: createResponseSchema(
						z.object({
							error: z.string(),
							message: z.string(),
							traceId: z.string(),
							details: z.object({ stack: z.string() }).optional(),
						}),
						'Erro interno do servidor',
					),
				},
			},
		},
		async () => {
			// Simula um erro inesperado
			throw new Error('Erro inesperado no servidor');
		},
	);
}
