/**
 * Extensões de tipos do Fastify
 */
declare module 'fastify' {
	interface FastifyRequest {
		traceId?: string;
	}
}
