/**
 * Extensões de tipos do Fastify
 */
declare module 'fastify' {
	interface FastifyRequest {
		storeContext?: {
			role: string;
			storeBucketKey: string;
			storeId: string;
			storeSlug: string;
			userId: string;
		};
		traceId?: string;
	}
}
