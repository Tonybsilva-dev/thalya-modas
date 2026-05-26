import type { ZodError } from 'zod';
import { AppError } from './app-error';

export interface ValidationErrorDetail {
	field: string;
	message: string;
	code?: string;
}

/**
 * Erro de validação (geralmente de schemas Zod)
 * Status: 400 Bad Request
 */
export class ValidationError extends AppError {
	constructor(
		message: string,
		options?: {
			details?: ValidationErrorDetail[];
			traceId?: string;
			cause?: Error;
		},
	) {
		super(message, 400, 'ValidationError', options);
	}

	/**
	 * Cria um ValidationError a partir de um ZodError
	 */
	static fromZodError(
		zodError: ZodError,
		options?: {
			traceId?: string;
		},
	): ValidationError {
		const details: ValidationErrorDetail[] = zodError.issues.map((issue) => ({
			field: issue.path.join('.'),
			message: issue.message,
			code: issue.code,
		}));

		const message =
			details.length === 1
				? details[0].message
				: `Erro de validação em ${details.length} campo(s)`;

		return new ValidationError(message, {
			details,
			traceId: options?.traceId,
			cause: zodError,
		});
	}
}
