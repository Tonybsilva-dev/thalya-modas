import { describe, expect, it } from 'vitest';
import { createTestServer, makeRequest } from '../helpers/test-server';

describe('GET /health/deep', () => {
	it('deve retornar health check detalhado com checks', async () => {
		const server = await createTestServer();

		const response = await makeRequest(server, {
			method: 'GET',
			url: '/health/deep',
		});

		expect(response.statusCode).toBe(200);
		expect(response.body).toHaveProperty('status', 'ok');
		expect(response.body).toHaveProperty('version');
		expect(response.body).toHaveProperty('uptime');
		expect(response.body).toHaveProperty('timestamp');
		expect(response.body).toHaveProperty('checks');
		// biome-ignore lint/suspicious/noExplicitAny: Necessário para acessar propriedades dinâmicas
		expect(typeof (response.body as any).checks).toBe('object');
	});

	it('deve incluir timestamp em formato ISO', async () => {
		const server = await createTestServer();

		const response = await makeRequest(server, {
			method: 'GET',
			url: '/health/deep',
		});

		// biome-ignore lint/suspicious/noExplicitAny: Necessário para acessar propriedades dinâmicas
		const body = response.body as any;
		expect(body.timestamp).toBeDefined();
		expect(typeof body.timestamp).toBe('string');
		// Verifica que é um formato ISO válido
		expect(() => new Date(body.timestamp)).not.toThrow();
		expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
	});

	it('deve incluir uptime como número', async () => {
		const server = await createTestServer();

		const response = await makeRequest(server, {
			method: 'GET',
			url: '/health/deep',
		});

		// biome-ignore lint/suspicious/noExplicitAny: Necessário para acessar propriedades dinâmicas
		const body = response.body as any;
		expect(body.uptime).toBeDefined();
		expect(typeof body.uptime).toBe('number');
		expect(body.uptime).toBeGreaterThanOrEqual(0);
	});
});
