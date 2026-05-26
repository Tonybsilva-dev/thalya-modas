import { env } from '../../../shared/env';

/** Schema JSON explícito para documentação Swagger (evita response vazio no OpenAPI). */
const healthResponseJsonSchema = {
	type: 'object' as const,
	required: ['status', 'version', 'uptime', 'timestamp'],
	properties: {
		status: { type: 'string' as const, enum: ['ok'] },
		version: { type: 'string' as const },
		uptime: { type: 'number' as const },
		timestamp: { type: 'string' as const, format: 'date-time' },
	},
};

const deepHealthResponseJsonSchema = {
	...healthResponseJsonSchema,
	required: ['status', 'version', 'uptime', 'timestamp', 'checks'],
	properties: {
		...healthResponseJsonSchema.properties,
		checks: {
			type: 'object' as const,
			properties: {
				database: { type: 'string' as const, enum: ['ok', 'error'] },
				cache: { type: 'string' as const, enum: ['ok', 'error'] },
			},
		},
	},
};

// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
export async function healthcheckRoutes(fastify: any) {
	// Health check básico
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).get(
		'/health',
		{
			schema: {
				description: 'Health check básico do serviço',
				tags: ['health'],
				response: {
					200: {
						description: 'Serviço está funcionando',
						...healthResponseJsonSchema,
						example: {
							status: 'ok',
							version: env.API_VERSION,
							uptime: 123.45,
							timestamp: new Date().toISOString(),
						},
					},
				},
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any, reply: any) => {
			// Garante que o header seja adicionado mesmo se o hook falhar
			const traceId = request.traceId;
			if (traceId) {
				reply.header('X-Trace-Id', traceId);
			}
			return {
				status: 'ok' as const,
				version: env.API_VERSION,
				uptime: process.uptime(),
				timestamp: new Date().toISOString(),
			};
		},
	);

	// Health check detalhado (deep check)
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).get(
		'/health/deep',
		{
			schema: {
				description: 'Health check detalhado com verificação de dependências',
				tags: ['health'],
				response: {
					200: {
						description: 'Serviço e dependências estão funcionando',
						...deepHealthResponseJsonSchema,
						example: {
							status: 'ok',
							version: env.API_VERSION,
							uptime: 123.45,
							timestamp: new Date().toISOString(),
							checks: {},
						},
					},
				},
			},
		},
		async () => {
			// TODO: Adicionar verificações reais de dependências quando implementadas
			const checks = {
				// database: await checkDatabase(),
				// cache: await checkCache(),
			};

			return {
				status: 'ok' as const,
				version: env.API_VERSION,
				uptime: process.uptime(),
				timestamp: new Date().toISOString(),
				checks,
			};
		},
	);
}
