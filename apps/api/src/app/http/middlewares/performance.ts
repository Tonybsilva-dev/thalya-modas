import { performance } from 'node:perf_hooks';
import type { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { metricsTracker } from '../../../shared/metrics/metrics-tracker';

/**
 * Middleware/hook de performance para medir o tempo total de cada requisição.
 *
 * Ele marca o início no `onRequest` e calcula a duração no `onResponse`,
 * garantindo que todo o processamento assíncrono (use cases, repositórios, etc.)
 * esteja incluído na medição.
 */

const PERFORMANCE_START_KEY = Symbol('performanceStart');

export async function performanceOnRequest(request: FastifyRequest) {
	(request as { [PERFORMANCE_START_KEY]?: number })[PERFORMANCE_START_KEY] =
		performance.now();
}

export async function performanceOnResponse(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const start = (
		request as {
			[PERFORMANCE_START_KEY]?: number;
		}
	)[PERFORMANCE_START_KEY];

	if (typeof start !== 'number') {
		return;
	}

	const end = performance.now();
	const durationMs = end - start;

	const rawRequest = request as unknown as {
		raw?: { method?: string; url?: string };
		routerPath?: string;
	};
	const rawReply = reply as unknown as {
		statusCode?: number;
		raw?: { statusCode?: number };
	};

	const method = rawRequest.raw?.method ?? 'UNKNOWN';
	const url = rawRequest.raw?.url ?? rawRequest.routerPath ?? 'UNKNOWN';
	const statusCode =
		typeof rawReply.statusCode === 'number'
			? rawReply.statusCode
			: rawReply.raw?.statusCode;

	const traceId = (request as { traceId?: string }).traceId;

	const routeKey = `${method} ${url}`;
	metricsTracker.add(routeKey, durationMs);
	const averageMs = metricsTracker.getAverage(routeKey);

	const messageBase = `⚡ [${method}] ${url} - ${durationMs.toFixed(
		4,
	)}ms (avg=${averageMs.toFixed(4)}ms, status=${statusCode ?? 'unknown'})`;
	const message = traceId ? `${messageBase} [traceId=${traceId}]` : messageBase;

	// Usa o logger do Fastify (com traceId, se disponível), com fallback para console.log
	const logger = (
		request as unknown as {
			log?: { info: (obj: unknown, msg?: string) => void };
		}
	).log;

	if (logger && typeof logger.info === 'function') {
		logger.info(
			{ durationMs, averageMs, method, url, statusCode, traceId, routeKey },
			message,
		);
	} else {
		console.log(message);
	}
}

/**
 * Plugin Fastify para registrar os hooks de performance globalmente.
 */
export default fp(
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	async function performancePlugin(fastify: any) {
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		(fastify as any).addHook('onRequest', performanceOnRequest);
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		(fastify as any).addHook('onResponse', performanceOnResponse);
	},
	{
		name: 'performance-metrics',
	},
);
