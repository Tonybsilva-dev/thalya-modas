import { randomUUID } from 'node:crypto';

/**
 * Gera um trace ID único para correlação de logs
 * Usado para rastrear requisições através de múltiplos serviços
 */
export function generateTraceId(): string {
	return randomUUID();
}

/**
 * Extrai trace ID de um header HTTP ou gera um novo
 */
export function getOrGenerateTraceId(traceIdHeader?: string): string {
	if (traceIdHeader?.trim()) {
		return traceIdHeader.trim();
	}
	return generateTraceId();
}
