import { AppError } from './app-error';

/**
 * Erro de autorização (usuário não tem permissão)
 * Status: 403 Forbidden
 */
export class ForbiddenError extends AppError {
	constructor(
		message: string = 'Você não tem permissão para acessar este recurso',
		options?: {
			details?: unknown;
			traceId?: string;
			cause?: Error;
		},
	) {
		super(message, 403, 'ForbiddenError', options);
	}
}
