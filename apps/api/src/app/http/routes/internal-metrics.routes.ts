import type { FastifyRequest } from 'fastify';
import { metricsTracker } from '../../../shared/metrics/metrics-tracker';

/**
 * Rotas internas de diagnóstico de métricas de performance.
 *
 * IMPORTANTE: estas rotas são registradas apenas em ambientes não produtivos
 * (ver `server.ts`), pois expõem detalhes internos de execução.
 */
export async function internalMetricsRoutes(
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tipos
	fastify: any,
) {
	fastify.get(
		'/internal/metrics/performance',
		{
			schema: {
				description:
					'Métricas agregadas de performance por rota (janela móvel em memória).',
				tags: ['internal'],
				security: [], // endpoint interno, sem autenticação no ambiente de dev
				response: {
					200: {
						type: 'object',
						properties: {
							metrics: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										routeKey: { type: 'string' },
										count: { type: 'integer' },
										averageMs: { type: 'number' },
										history: {
											type: 'array',
											items: { type: 'number' },
										},
									},
									required: ['routeKey', 'count', 'averageMs', 'history'],
								},
							},
						},
						required: ['metrics'],
					},
				},
			},
		},
		async (_request: FastifyRequest) => {
			const snapshot = metricsTracker.getAll();
			return { metrics: snapshot };
		},
	);
}
