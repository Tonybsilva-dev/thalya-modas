import type { FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import '../types';
import { getOrGenerateTraceId } from '../../../shared/utils/trace-id';

/**
 * Middleware para adicionar traceId automaticamente em todas as requisições
 * O traceId pode ser fornecido via header X-Trace-Id ou será gerado automaticamente
 */
export async function traceIdMiddleware(
	request: FastifyRequest,
	_reply: unknown,
) {
	const requestHeaders = (
		request as { headers?: Record<string, string | string[] | undefined> }
	).headers;
	const traceIdHeader = requestHeaders?.['x-trace-id'] as string | undefined;
	const traceId = getOrGenerateTraceId(traceIdHeader);
	request.traceId = traceId;

	// Adiciona traceId ao logger context para aparecer automaticamente nos logs
	const logger = (
		request as {
			log?: { child: (bindings: Record<string, unknown>) => unknown };
		}
	).log;
	if (logger) {
		(request as { log: unknown }).log = logger.child({ traceId });
	}
}

/**
 * PreHandler global para adicionar o header X-Trace-Id em todas as rotas
 * Headers devem ser adicionados no preHandler usando reply.header()
 */
export async function traceIdPreHandler(
	request: FastifyRequest,
	reply: unknown,
) {
	const traceId = request.traceId;
	if (traceId) {
		const replyObj = reply as {
			header?: (name: string, value: string) => unknown;
		};
		if (replyObj.header && typeof replyObj.header === 'function') {
			replyObj.header('X-Trace-Id', traceId);
		}
	}
}

/**
 * Hook onSend para garantir que o traceId seja adicionado mesmo se não foi no preHandler
 * No Fastify, o hook onSend recebe (request, reply, payload) e pode retornar o payload modificado
 */
export async function onSendTraceIdHook(
	request: FastifyRequest,
	reply: unknown,
	payload: unknown,
) {
	const traceId = request.traceId;
	if (traceId) {
		const replyObj = reply as {
			header?: (name: string, value: string) => unknown;
		};
		if (replyObj.header && typeof replyObj.header === 'function') {
			replyObj.header('X-Trace-Id', traceId);
		}
	}
	return payload;
}

/**
 * Plugin Fastify para registrar o middleware de traceId
 * Usa fastify-plugin para garantir que os hooks sejam aplicados globalmente
 */
export default fp(
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	async function traceIdPlugin(fastify: any) {
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		(fastify as any).addHook('onRequest', traceIdMiddleware);
		// Adiciona preHandler global para garantir que o header seja adicionado em todas as rotas
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		(fastify as any).addHook('preHandler', traceIdPreHandler);
		// Adiciona onSend hook como fallback para garantir que o header seja adicionado
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		(fastify as any).addHook('onSend', onSendTraceIdHook);
	},
	{
		name: 'trace-id',
	},
);
