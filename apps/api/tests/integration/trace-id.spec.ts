import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestServer, makeRequest } from './helpers';

describe('Trace ID - Integração', () => {
	let server: FastifyInstance;

	beforeEach(async () => {
		server = await createTestServer();
	});

	afterEach(async () => {
		await server.close();
	});

	describe('Header X-Trace-Id', () => {
		it('deve adicionar o header X-Trace-Id automaticamente em todas as respostas', async () => {
			const response = await makeRequest(server, {
				method: 'GET',
				url: '/health',
			});

			expect(response.statusCode).toBe(200);

			// Debug: imprime todos os headers para diagnóstico
			console.log('Response headers keys:', Object.keys(response.headers));
			console.log('Response headers:', response.headers);

			expect(response.headers).toHaveProperty('x-trace-id');
			expect(response.headers['x-trace-id']).toBeDefined();
			expect(response.headers['x-trace-id']).toBeTypeOf('string');
		});

		it('deve gerar um traceId no formato UUID quando não fornecido', async () => {
			const response = await makeRequest(server, {
				method: 'GET',
				url: '/health',
			});

			const traceId = response.headers['x-trace-id'] as string;
			expect(traceId).toBeDefined();

			// Valida formato UUID v4
			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			expect(traceId).toMatch(uuidRegex);
		});

		it('deve usar o traceId fornecido via header X-Trace-Id na requisição', async () => {
			const customTraceId = '550e8400-e29b-41d4-a716-446655440000';

			const response = await makeRequest(server, {
				method: 'GET',
				url: '/health',
				headers: {
					'X-Trace-Id': customTraceId,
				},
			});

			expect(response.statusCode).toBe(200);
			expect(response.headers['x-trace-id']).toBe(customTraceId);
		});

		it('deve gerar traceIds diferentes para requisições diferentes', async () => {
			const response1 = await makeRequest(server, {
				method: 'GET',
				url: '/health',
			});

			const response2 = await makeRequest(server, {
				method: 'GET',
				url: '/health',
			});

			const traceId1 = response1.headers['x-trace-id'] as string;
			const traceId2 = response2.headers['x-trace-id'] as string;

			expect(traceId1).toBeDefined();
			expect(traceId2).toBeDefined();
			expect(traceId1).not.toBe(traceId2);
		});

		it('deve incluir o header X-Trace-Id em todas as rotas', async () => {
			// Testa na rota raiz
			const rootResponse = await makeRequest(server, {
				method: 'GET',
				url: '/',
			});

			expect(rootResponse.statusCode).toBe(200);
			expect(rootResponse.headers['x-trace-id']).toBeDefined();

			// Testa na rota de health
			const healthResponse = await makeRequest(server, {
				method: 'GET',
				url: '/health',
			});

			expect(healthResponse.statusCode).toBe(200);
			expect(healthResponse.headers['x-trace-id']).toBeDefined();
		});

		it('deve incluir o header X-Trace-Id mesmo em respostas de erro', async () => {
			// Faz uma requisição para uma rota inexistente (404)
			const response = await makeRequest(server, {
				method: 'GET',
				url: '/rota-inexistente',
			});

			expect(response.statusCode).toBe(404);
			const traceId = response.headers['x-trace-id'] as string;
			expect(traceId).toBeDefined();

			// Valida formato UUID
			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			expect(traceId).toMatch(uuidRegex);
		});
	});
});
