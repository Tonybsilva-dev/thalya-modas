import type { FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { env } from '../../../shared/env';
import { getOrGenerateTraceId } from '../../../shared/utils/trace-id';
import { AppError } from '../errors/app-error';
import { type ErrorLevel, getErrorDescriptor } from '../errors/error-catalog';
import { ValidationError } from '../errors/validation-error';
import '../types';

// FastifyReply não é exportado diretamente no Fastify 5.x
// Usamos uma type assertion baseada na assinatura do setErrorHandler
type FastifyReply = {
	code: (code: number) => FastifyReply;
	send: (payload: unknown) => FastifyReply;
	status: (code: number) => FastifyReply;
};

// FastifyError é uma interface que estende Error com propriedades adicionais
interface FastifyError extends Error {
	statusCode?: number;
	validation?: unknown[];
}

/**
 * Middleware global de tratamento de erros
 * Converte erros conhecidos em respostas HTTP padronizadas
 */
export async function errorHandler(
	error: FastifyError | Error,
	request: FastifyRequest,
	reply: FastifyReply,
) {
	// Extrai ou gera traceId
	const headers = (
		request as { headers?: Record<string, string | string[] | undefined> }
	).headers;
	const traceId = getOrGenerateTraceId(
		headers?.['x-trace-id'] as string | undefined,
	);
	const instance =
		(request as { raw?: { url?: string }; routeOptions?: { url?: string } }).raw
			?.url ??
		(request as { routeOptions?: { url?: string } }).routeOptions?.url ??
		'';

	// Adiciona traceId ao request para uso em logs
	request.traceId = traceId;

	let statusCode: number;
	let responseBody: {
		type: string;
		title: string;
		status: number;
		detail: string;
		instance: string;
		code: string;
		acronym: string;
		level: ErrorLevel;
		category: string;
		error: string;
		message: string;
		details?: unknown;
		traceId: string;
		userMessage: string;
	};

	// Trata erros conhecidos
	if (error instanceof AppError) {
		const errorJson = error.toJSON();
		const descriptor = getErrorDescriptor(errorJson.error);
		statusCode = error.statusCode;
		responseBody = {
			type: descriptor.type,
			title: descriptor.title,
			status: statusCode,
			detail: errorJson.message,
			instance,
			code: descriptor.code,
			acronym: descriptor.acronym,
			level: descriptor.level,
			category: descriptor.category,
			error: errorJson.error,
			message: errorJson.message,
			traceId: errorJson.traceId || traceId,
			userMessage: errorJson.message,
		};
		if (errorJson.details) {
			responseBody.details = errorJson.details;
		}
	} else if (error instanceof ZodError) {
		// Converte ZodError em ValidationError
		const appError = ValidationError.fromZodError(error, { traceId });
		const errorJson = appError.toJSON();
		const descriptor = getErrorDescriptor(errorJson.error);
		statusCode = appError.statusCode;
		responseBody = {
			type: descriptor.type,
			title: descriptor.title,
			status: statusCode,
			detail: errorJson.message,
			instance,
			code: descriptor.code,
			acronym: descriptor.acronym,
			level: descriptor.level,
			category: descriptor.category,
			error: errorJson.error,
			message: errorJson.message,
			traceId: errorJson.traceId || traceId,
			userMessage: errorJson.message,
		};
		if (errorJson.details) {
			responseBody.details = errorJson.details;
		}
	} else {
		// Verifica se é FastifyError com validation
		const fastifyError = error as FastifyError;
		if (fastifyError.validation) {
			// Erro de validação do Fastify (schema validation)
			const descriptor = getErrorDescriptor('ValidationError');
			statusCode = 400;
			responseBody = {
				type: descriptor.type,
				title: descriptor.title,
				status: statusCode,
				detail: 'Erro de validação nos dados fornecidos',
				instance,
				code: descriptor.code,
				acronym: descriptor.acronym,
				level: descriptor.level,
				category: descriptor.category,
				error: 'ValidationError',
				message: 'Erro de validação nos dados fornecidos',
				details: fastifyError.validation,
				traceId,
				userMessage: 'Revise os campos destacados e tente novamente.',
			};
		} else {
			// Erro desconhecido
			statusCode = fastifyError.statusCode || 500;
			const descriptor = getErrorDescriptor('InternalServerError');
			const errorMessage =
				env.NODE_ENV === 'production'
					? 'Erro interno do servidor'
					: error.message || 'Erro interno do servidor';

			responseBody = {
				type: descriptor.type,
				title: descriptor.title,
				status: statusCode,
				detail: errorMessage,
				instance,
				code: descriptor.code,
				acronym: descriptor.acronym,
				level: descriptor.level,
				category: descriptor.category,
				error: 'InternalServerError',
				message: errorMessage,
				traceId,
				userMessage: errorMessage,
			};

			// Em desenvolvimento, inclui stack trace nos detalhes
			if (env.NODE_ENV !== 'production' && error.stack) {
				const details: { stack: string; cause?: unknown } = {
					stack: error.stack,
				};
				if (error.cause) {
					details.cause = error.cause;
				}
				responseBody.details = details;
			}
		}
	}

	// Log do erro
	const logLevel = statusCode >= 500 ? 'error' : 'warn';
	const logger = (
		request as {
			log?: {
				error: (obj: unknown, msg?: string) => void;
				warn: (obj: unknown, msg?: string) => void;
			};
		}
	).log;
	if (logger) {
		logger[logLevel](
			{
				err: error,
				traceId,
				statusCode,
				method: (request as { raw?: { method?: string; url?: string } }).raw
					?.method,
				url: (request as { raw?: { method?: string; url?: string } }).raw?.url,
			},
			`Error ${statusCode}: ${responseBody.message}`,
		);
	}

	// Responde com erro padronizado
	return (
		reply as { code: (code: number) => { send: (payload: unknown) => unknown } }
	)
		.code(statusCode)
		.send(responseBody);
}
