import type { FastifyCorsOptions } from '@fastify/cors';
import { env } from '../../../shared/env';

export const corsMethods = [
	'GET',
	'HEAD',
	'POST',
	'PUT',
	'PATCH',
	'DELETE',
	'OPTIONS',
] as const;

export function getCorsConfig(): FastifyCorsOptions {
	return {
		credentials: true,
		exposedHeaders: ['X-Store-Id'],
		methods: [...corsMethods],
		origin:
			env.CORS_ORIGINS.length > 0
				? env.CORS_ORIGINS
				: env.NODE_ENV !== 'production',
	};
}
