import { AppError } from './app-error';

/**
 * Erro relacionado a regras de negócio do domínio
 * Status: 400 Bad Request
 */
export class DomainError extends AppError {
	constructor(
		message: string,
		options?: {
			details?: unknown;
			traceId?: string;
			cause?: Error;
		},
	) {
		super(message, 400, 'DomainError', options);
	}
}
