import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestServer, makeRequest } from '../helpers';

const dashboardEndpoints = [
	'/dashboard/overview',
	'/dashboard/orders',
	'/dashboard/inventory',
	'/dashboard/customers',
	'/dashboard/cash-register',
	'/dashboard/suppliers',
	'/dashboard/reports',
] as const;

describe('Dashboard - Integração', () => {
	let server: FastifyInstance;

	beforeEach(async () => {
		server = await createTestServer();
	});

	afterEach(async () => {
		await server.close();
	});

	it.each(dashboardEndpoints)('deve exigir autenticação em %s', async (url) => {
		const response = await makeRequest(server, {
			method: 'GET',
			url,
		});

		expect(response.statusCode).toBe(401);
		expect(response.body).toMatchObject({
			error: 'UnauthorizedError',
			code: 'TM-AUTH-401',
		});
	});

	it.each(dashboardEndpoints)(
		'deve retornar dados de dashboard autenticado em %s',
		async (url) => {
			const token = await registerAndGetToken();
			const response = await makeRequest(server, {
				method: 'GET',
				url,
				headers: { authorization: `Bearer ${token}` },
			});

			expect(response.statusCode).toBe(200);
			expect(response.body).toEqual(expect.any(Object));
		},
	);

	it('deve retornar overview com cards, pulso de vendas e risco de estoque', async () => {
		const token = await registerAndGetToken();
		const response = await makeRequest(server, {
			method: 'GET',
			url: '/dashboard/overview',
			headers: { authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(200);
		expect(response.body).toMatchObject({
			store: {
				name: 'Store Flow',
			},
			salesPulse: {
				status: 'AO VIVO',
			},
			inventoryRisk: {
				title: 'Risco de estoque',
			},
		});
		expect((response.body as { metrics: unknown[] }).metrics).toHaveLength(4);
	});

	it('deve retornar pedidos com filas e tabela operacional', async () => {
		const token = await registerAndGetToken();
		const response = await makeRequest(server, {
			method: 'GET',
			url: '/dashboard/orders',
			headers: { authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(200);
		expect(response.body).toMatchObject({
			queues: expect.arrayContaining([
				expect.objectContaining({ status: 'Pronto' }),
			]),
			orders: expect.arrayContaining([
				expect.objectContaining({ id: '#1842' }),
			]),
		});
	});

	it('deve bloquear dashboard global pelo kill switch', async () => {
		await server.close();
		server = await createTestServer(undefined, {
			featureFlags: { dashboard: false },
		});
		const token = await registerAndGetToken();

		const response = await makeRequest(server, {
			method: 'GET',
			url: '/dashboard/overview',
			headers: { authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(403);
		expect(response.body).toMatchObject({
			error: 'FeatureDisabledError',
			code: 'TM-FEAT-403',
		});
	});

	it('deve bloquear rota individual pelo kill switch', async () => {
		await server.close();
		server = await createTestServer(undefined, {
			featureFlags: { 'dashboard.orders': false },
		});
		const token = await registerAndGetToken();

		const response = await makeRequest(server, {
			method: 'GET',
			url: '/dashboard/orders',
			headers: { authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(403);
		expect(response.body).toMatchObject({
			error: 'FeatureDisabledError',
			code: 'TM-FEAT-403',
		});
	});

	async function registerAndGetToken() {
		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/register',
			body: {
				name: 'Ana Ribeiro',
				email: `dashboard-${randomUUID()}@thalya.test`,
				password: 'Secure123',
			},
		});

		return (response.body as { token: string }).token;
	}
});
