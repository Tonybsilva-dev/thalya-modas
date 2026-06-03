import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestServer, makeRequest } from '../helpers';

describe('Catalog - Integração', () => {
	let server: FastifyInstance;

	beforeEach(async () => {
		server = await createTestServer();
	});

	afterEach(async () => {
		await server.close();
	});

	it('deve exigir autenticação nas rotas de catálogo', async () => {
		const response = await makeRequest(server, {
			method: 'GET',
			url: '/products',
		});

		expect(response.statusCode).toBe(401);
		expect(response.body).toMatchObject({
			code: 'TM-AUTH-401',
			error: 'UnauthorizedError',
		});
	});

	it('deve criar fornecedor, produto e ajuste de estoque', async () => {
		const token = await registerAndGetToken();
		const supplierResponse = await createSupplier(token);

		expect(supplierResponse.statusCode).toBe(201);
		expect(supplierResponse.body).toMatchObject({
			name: 'Moda Bella Distribuidora',
			status: 'active',
		});

		const supplierId = (supplierResponse.body as { id: string }).id;
		const productResponse = await makeRequest(server, {
			body: {
				currentStock: 4,
				minimumStock: 2,
				name: 'Vestido midi canelado',
				sku: `VD-${randomUUID().slice(0, 8)}`,
				supplierId,
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/products',
		});

		expect(productResponse.statusCode).toBe(201);
		expect(productResponse.body).toMatchObject({
			currentStock: 4,
			name: 'Vestido midi canelado',
			supplierId,
		});

		const productId = (productResponse.body as { id: string }).id;
		const adjustmentResponse = await makeRequest(server, {
			body: {
				productId,
				quantity: 3,
				reason: 'Recebimento de fornecedor',
				type: 'in',
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/inventory/adjustments',
		});

		expect(adjustmentResponse.statusCode).toBe(201);
		expect(adjustmentResponse.body).toMatchObject({
			currentStock: 7,
			previousStock: 4,
			type: 'in',
		});
	});

	it('deve impedir SKU duplicado por usuário', async () => {
		const token = await registerAndGetToken();
		const sku = `SKU-${randomUUID().slice(0, 8)}`;
		const body = { name: 'Calca alfaiataria', sku };

		const first = await makeRequest(server, {
			body,
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/products',
		});
		const second = await makeRequest(server, {
			body,
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/products',
		});

		expect(first.statusCode).toBe(201);
		expect(second.statusCode).toBe(400);
		expect(second.body).toMatchObject({
			code: 'TM-DOM-400',
		});
	});

	it('deve gerenciar responsáveis do fornecedor mantendo apenas um principal', async () => {
		const token = await registerAndGetToken();
		const supplier = await createSupplier(token);
		const supplierId = (supplier.body as { id: string }).id;

		const first = await createResponsible(token, supplierId, {
			email: 'carla@modabella.test',
			isPrimary: true,
			name: 'Carla Menezes',
		});
		const second = await createResponsible(token, supplierId, {
			email: 'rafael@modabella.test',
			isPrimary: false,
			name: 'Rafael Lima',
		});

		expect(first.statusCode).toBe(201);
		expect(second.statusCode).toBe(201);

		const secondId = (second.body as { id: string }).id;
		const update = await makeRequest(server, {
			body: { isPrimary: true },
			headers: { authorization: `Bearer ${token}` },
			method: 'PATCH',
			url: `/suppliers/${supplierId}/responsibles/${secondId}`,
		});

		expect(update.statusCode).toBe(200);

		const list = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'GET',
			url: `/suppliers/${supplierId}/responsibles`,
		});
		const responsibles = list.body as Array<{ id: string; isPrimary: boolean }>;

		expect(list.statusCode).toBe(200);
		expect(responsibles).toHaveLength(2);
		expect(responsibles.filter((responsible) => responsible.isPrimary)).toEqual([
			expect.objectContaining({ id: secondId }),
		]);

		const remove = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'DELETE',
			url: `/suppliers/${supplierId}/responsibles/${secondId}`,
		});

		expect(remove.statusCode).toBe(204);
	});

	it('deve preparar upload apenas para imagem WebP', async () => {
		const token = await registerAndGetToken();
		const product = await createProduct(token);
		const productId = (product.body as { id: string }).id;

		const invalid = await makeRequest(server, {
			body: {
				contentType: 'image/png',
				fileName: 'produto.png',
				size: 1000,
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: `/products/${productId}/assets/upload`,
		});

		expect(invalid.statusCode).toBe(400);

		const valid = await makeRequest(server, {
			body: {
				contentType: 'image/webp',
				fileName: 'produto.webp',
				size: 1000,
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: `/products/${productId}/assets/upload`,
		});

		expect(valid.statusCode).toBe(201);
		expect(valid.body).toMatchObject({
			asset: {
				contentType: 'image/webp',
				fileName: 'produto.webp',
				productId,
			},
			upload: {
				headers: { 'content-type': 'image/webp' },
				method: 'PUT',
			},
		});
	});

	it('deve bloquear catálogo pelo kill switch', async () => {
		await server.close();
		server = await createTestServer(undefined, {
			featureFlags: { catalog: false },
		});
		const token = await registerAndGetToken();

		const response = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'GET',
			url: '/products',
		});

		expect(response.statusCode).toBe(403);
		expect(response.body).toMatchObject({
			code: 'TM-FEAT-403',
			error: 'FeatureDisabledError',
		});
	});

	async function createSupplier(token: string) {
		return makeRequest(server, {
			body: {
				document: randomUUID().replaceAll('-', '').slice(0, 14),
				email: `supplier-${randomUUID()}@thalya.test`,
				name: 'Moda Bella Distribuidora',
				phone: '85999998888',
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/suppliers',
		});
	}

	async function createProduct(token: string) {
		return makeRequest(server, {
			body: {
				name: 'Sandalia tiras nude',
				sku: `SN-${randomUUID().slice(0, 8)}`,
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/products',
		});
	}

	async function createResponsible(
		token: string,
		supplierId: string,
		overrides: Partial<{
			email: string;
			isPrimary: boolean;
			name: string;
		}> = {},
	) {
		return makeRequest(server, {
			body: {
				contactType: 'orders',
				email: overrides.email ?? `responsible-${randomUUID()}@thalya.test`,
				isPrimary: overrides.isPrimary ?? false,
				name: overrides.name ?? 'Camila Santos',
				phone: '85999997777',
				role: 'Comercial',
				status: 'active',
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: `/suppliers/${supplierId}/responsibles`,
		});
	}

	async function registerAndGetToken() {
		const response = await makeRequest(server, {
			body: {
				email: `catalog-${randomUUID()}@thalya.test`,
				name: 'Ana Ribeiro',
				password: 'Secure123',
			},
			method: 'POST',
			url: '/auth/register',
		});

		return (response.body as { token: string }).token;
	}
});
