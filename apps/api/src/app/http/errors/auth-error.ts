import { AppError } from './app-error';

/**
 * Erro de autenticação (token inválido, expirado, etc.)
 * Status: 401 Unauthorized
 */
export class AuthError extends AppError {
	constructor(
		message: string = 'Token de autenticação inválido ou expirado',
		options?: {
			details?: unknown;
			traceId?: string;
			cause?: Error;
		},
	) {
		super(message, 401, 'UnauthorizedError', options);
	}
}
