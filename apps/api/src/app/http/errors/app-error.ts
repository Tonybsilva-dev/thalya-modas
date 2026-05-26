/**
 * Classe base para todos os erros da aplicação
 * Fornece estrutura padronizada para erros HTTP
 */
export abstract class AppError extends Error {
	public readonly statusCode: number;
	public readonly errorCode: string;
	public readonly details?: unknown;
	public readonly traceId?: string;

	constructor(
		message: string,
		statusCode: number,
		errorCode: string,
		options?: {
			details?: unknown;
			traceId?: string;
			cause?: Error;
		},
	) {
		super(message, { cause: options?.cause });
		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.errorCode = errorCode;
		this.details = options?.details;
		this.traceId = options?.traceId;

		// Mantém o stack trace correto
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	/**
	 * Serializa o erro para resposta HTTP
	 */
	toJSON(): {
		error: string;
		message: string;
		details?: unknown;
		traceId?: string;
	} {
		const json: {
			error: string;
			message: string;
			details?: unknown;
			traceId?: string;
		} = {
			error: this.errorCode,
			message: this.message,
		};

		if (this.details) {
			json.details = this.details;
		}

		if (this.traceId) {
			json.traceId = this.traceId;
		}

		return json;
	}
}
