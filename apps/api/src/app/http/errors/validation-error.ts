import type { ZodError } from 'zod';
import { AppError } from './app-error';

export interface ValidationErrorDetail {
	code?: string;
	field: string;
	message: string;
	path: Array<number | string>;
	userMessage: string;
}

function getFieldFromPath(path: Array<number | string>): string {
	return path.length > 0 ? path.join('.') : '_root';
}

function normalizePath(path: PropertyKey[]): Array<number | string> {
	return path.map((segment) =>
		typeof segment === 'symbol' ? String(segment) : segment,
	);
}

function getUserMessageFromZodIssue(issue: ZodError['issues'][number]): string {
	if (issue.message) {
		return issue.message;
	}

	if (issue.code === 'invalid_type') {
		return 'Campo obrigatório ou em formato inválido.';
	}

	return 'Valor inválido.';
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
		const details: ValidationErrorDetail[] = zodError.issues.map((issue) => {
			const path = normalizePath(issue.path);
			const userMessage = getUserMessageFromZodIssue(issue);

			return {
				code: issue.code,
				field: getFieldFromPath(path),
				message: issue.message,
				path,
				userMessage,
			};
		});

		const message =
			details.length === 1
				? details[0].userMessage
				: 'Revise os campos destacados e tente novamente.';

		return new ValidationError(message, {
			details,
			traceId: options?.traceId,
			cause: zodError,
		});
	}
}
