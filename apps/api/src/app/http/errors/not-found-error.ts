import { AppError } from './app-error';

/**
 * Erro quando recurso não é encontrado
 * Status: 404 Not Found
 */
export class NotFoundError extends AppError {
	constructor(
		message: string = 'Recurso não encontrado',
		options?: {
			details?: unknown;
			traceId?: string;
			cause?: Error;
		},
	) {
		super(message, 404, 'NotFoundError', options);
	}
}
