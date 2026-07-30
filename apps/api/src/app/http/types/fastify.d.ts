/**
 * Extensões de tipos do Fastify
 */
declare module 'fastify' {
	interface FastifyRequest {
		storeContext?: {
			role: string;
			storeId: string;
			userId: string;
		};
		traceId?: string;
	}
}
