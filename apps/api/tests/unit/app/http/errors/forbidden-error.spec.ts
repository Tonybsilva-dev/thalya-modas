import { describe, expect, it } from 'vitest';
import { ForbiddenError } from '../../../../../src/app/http/errors/forbidden-error';

describe('ForbiddenError', () => {
	it('deve criar erro com mensagem padrão', () => {
		const error = new ForbiddenError();

		expect(error.message).toBe(
			'Você não tem permissão para acessar este recurso',
		);
		expect(error.statusCode).toBe(403);
		expect(error.errorCode).toBe('ForbiddenError');
		expect(error.name).toBe('ForbiddenError');
	});

	it('deve criar erro com mensagem customizada', () => {
		const customMessage = 'Acesso negado a este recurso';
		const error = new ForbiddenError(customMessage);

		expect(error.message).toBe(customMessage);
		expect(error.statusCode).toBe(403);
		expect(error.errorCode).toBe('ForbiddenError');
	});

	it('deve incluir details quando fornecido', () => {
		const details = { resource: 'user', action: 'delete' };
		const error = new ForbiddenError('Acesso negado', { details });

		expect(error.details).toEqual(details);
		expect(error.toJSON().details).toEqual(details);
	});

	it('deve incluir traceId quando fornecido', () => {
		const traceId = 'trace-123';
		const error = new ForbiddenError('Acesso negado', { traceId });

		expect(error.traceId).toBe(traceId);
		expect(error.toJSON().traceId).toBe(traceId);
	});

	it('deve incluir cause quando fornecido', () => {
		const cause = new Error('Original error');
		const error = new ForbiddenError('Acesso negado', { cause });

		expect(error.cause).toBe(cause);
	});

	it('deve serializar corretamente para JSON', () => {
		const error = new ForbiddenError('Acesso negado', {
			details: { reason: 'insufficient_permissions' },
			traceId: 'trace-456',
		});

		const json = error.toJSON();

		expect(json).toEqual({
			error: 'ForbiddenError',
			message: 'Acesso negado',
			details: { reason: 'insufficient_permissions' },
			traceId: 'trace-456',
		});
	});

	it('deve serializar sem details e traceId quando não fornecidos', () => {
		const error = new ForbiddenError('Acesso negado');

		const json = error.toJSON();

		expect(json).toEqual({
			error: 'ForbiddenError',
			message: 'Acesso negado',
		});
		expect(json.details).toBeUndefined();
		expect(json.traceId).toBeUndefined();
	});
});
