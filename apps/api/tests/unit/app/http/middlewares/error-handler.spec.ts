import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import { ForbiddenError } from '../../../../../src/app/http/errors/forbidden-error';
import { NotFoundError } from '../../../../../src/app/http/errors/not-found-error';
import { ValidationError } from '../../../../../src/app/http/errors/validation-error';
import { errorHandler } from '../../../../../src/app/http/middlewares/error-handler';

// Mock do env
vi.mock('../../../../../src/shared/env', () => ({
	env: {
		NODE_ENV: 'test',
	},
}));

describe('errorHandler', () => {
	// biome-ignore lint/suspicious/noExplicitAny: Necessário para mock do Fastify
	let mockRequest: any;
	// biome-ignore lint/suspicious/noExplicitAny: Necessário para mock do Fastify
	let mockReply: any;
	// biome-ignore lint/suspicious/noExplicitAny: Necessário para mock do Fastify
	let mockLogger: any;

	beforeEach(() => {
		mockLogger = {
			error: vi.fn(),
			warn: vi.fn(),
		};

		mockRequest = {
			headers: {},
			traceId: undefined,
			log: mockLogger,
			raw: {
				method: 'GET',
				url: '/test',
			},
		};

		mockReply = {
			code: vi.fn().mockReturnThis(),
			send: vi.fn().mockReturnThis(),
			status: vi.fn().mockReturnThis(),
		};
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('deve tratar AppError corretamente', async () => {
		const error = new NotFoundError('Recurso não encontrado', {
			traceId: 'trace-123',
		});

		await errorHandler(error, mockRequest, mockReply);

		expect(mockReply.code).toHaveBeenCalledWith(404);
		expect(mockReply.send).toHaveBeenCalledWith({
			error: 'NotFoundError',
			message: 'Recurso não encontrado',
			traceId: 'trace-123',
		});
		expect(mockLogger.warn).toHaveBeenCalled();
	});

	it('deve tratar AppError com details', async () => {
		const error = new ValidationError('Erro de validação', {
			details: [{ field: 'email', message: 'Email inválido' }],
			traceId: 'trace-456',
		});

		await errorHandler(error, mockRequest, mockReply);

		expect(mockReply.code).toHaveBeenCalledWith(400);
		expect(mockReply.send).toHaveBeenCalledWith({
			error: 'ValidationError',
			message: 'Erro de validação',
			details: [{ field: 'email', message: 'Email inválido' }],
			traceId: 'trace-456',
		});
	});

	it('deve tratar ZodError convertendo para ValidationError', async () => {
		const zodError = new ZodError([
			{
				path: ['email'],
				message: 'Email inválido',
				code: 'invalid_string',
			},
		]);

		await errorHandler(zodError, mockRequest, mockReply);

		expect(mockReply.code).toHaveBeenCalledWith(400);
		expect(mockReply.send).toHaveBeenCalledWith(
			expect.objectContaining({
				error: 'ValidationError',
				traceId: expect.any(String),
			}),
		);
		expect(mockReply.send).toHaveBeenCalledWith(
			expect.objectContaining({
				details: expect.arrayContaining([
					expect.objectContaining({
						field: 'email',
						message: 'Email inválido',
					}),
				]),
			}),
		);
	});

	it('deve extrair traceId dos headers quando disponível', async () => {
		mockRequest.headers = { 'x-trace-id': 'header-trace-123' };

		const error = new NotFoundError('Recurso não encontrado');

		await errorHandler(error, mockRequest, mockReply);

		expect(mockRequest.traceId).toBe('header-trace-123');
		expect(mockReply.send).toHaveBeenCalledWith(
			expect.objectContaining({
				traceId: 'header-trace-123',
			}),
		);
	});

	it('deve gerar traceId quando não disponível nos headers', async () => {
		const error = new NotFoundError('Recurso não encontrado');

		await errorHandler(error, mockRequest, mockReply);

		expect(mockRequest.traceId).toBeDefined();
		expect(typeof mockRequest.traceId).toBe('string');
		expect(mockReply.send).toHaveBeenCalledWith(
			expect.objectContaining({
				traceId: expect.any(String),
			}),
		);
	});

	it('deve tratar FastifyError com validation', async () => {
		const fastifyError = {
			name: 'FastifyError',
			message: 'Validation failed',
			validation: [
				{
					instancePath: '/email',
					schemaPath: '#/properties/email/type',
					keyword: 'type',
					params: { type: 'string' },
					message: 'must be string',
				},
			],
		};

		await errorHandler(fastifyError, mockRequest, mockReply);

		expect(mockReply.code).toHaveBeenCalledWith(400);
		expect(mockReply.send).toHaveBeenCalledWith({
			error: 'ValidationError',
			message: 'Erro de validação nos dados fornecidos',
			details: fastifyError.validation,
			traceId: expect.any(String),
		});
	});

	it('deve tratar erro desconhecido com statusCode 500', async () => {
		const error = new Error('Erro desconhecido');

		await errorHandler(error, mockRequest, mockReply);

		expect(mockReply.code).toHaveBeenCalledWith(500);
		expect(mockReply.send).toHaveBeenCalledWith(
			expect.objectContaining({
				error: 'InternalServerError',
				message: 'Erro desconhecido',
				traceId: expect.any(String),
			}),
		);
		// Em modo test/development, pode incluir stack trace nos details
		expect(mockReply.send).toHaveBeenCalled();
		expect(mockLogger.error).toHaveBeenCalled();
	});

	it('deve tratar erro desconhecido com statusCode customizado', async () => {
		const error = {
			name: 'CustomError',
			message: 'Custom error',
			statusCode: 418,
		} as Error & { statusCode: number };

		await errorHandler(error, mockRequest, mockReply);

		expect(mockReply.code).toHaveBeenCalledWith(418);
		expect(mockReply.send).toHaveBeenCalledWith({
			error: 'InternalServerError',
			message: 'Custom error',
			traceId: expect.any(String),
		});
	});

	it('deve usar logLevel error para statusCode >= 500', async () => {
		const error = new Error('Server error');

		await errorHandler(error, mockRequest, mockReply);

		expect(mockLogger.error).toHaveBeenCalled();
		expect(mockLogger.warn).not.toHaveBeenCalled();
	});

	it('deve usar logLevel warn para statusCode < 500', async () => {
		const error = new NotFoundError('Not found');

		await errorHandler(error, mockRequest, mockReply);

		expect(mockLogger.warn).toHaveBeenCalled();
		expect(mockLogger.error).not.toHaveBeenCalled();
	});

	it('deve incluir informações do request nos logs', async () => {
		const error = new Error('Test error');

		await errorHandler(error, mockRequest, mockReply);

		expect(mockLogger.error).toHaveBeenCalledWith(
			expect.objectContaining({
				err: error,
				traceId: expect.any(String),
				statusCode: 500,
				method: 'GET',
				url: '/test',
			}),
			expect.stringContaining('Error 500'),
		);
	});

	it('deve funcionar sem logger disponível', async () => {
		mockRequest.log = undefined;

		const error = new NotFoundError('Not found');

		await errorHandler(error, mockRequest, mockReply);

		expect(mockReply.code).toHaveBeenCalledWith(404);
		expect(mockReply.send).toHaveBeenCalled();
	});

	it('deve tratar ForbiddenError corretamente', async () => {
		const error = new ForbiddenError('Acesso negado', {
			traceId: 'trace-789',
		});

		await errorHandler(error, mockRequest, mockReply);

		expect(mockReply.code).toHaveBeenCalledWith(403);
		expect(mockReply.send).toHaveBeenCalledWith({
			error: 'ForbiddenError',
			message: 'Acesso negado',
			traceId: 'trace-789',
		});
		expect(mockLogger.warn).toHaveBeenCalled();
	});
});
