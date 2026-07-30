import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { InMemoryStoreRepository } from '../../../src/core/infra/persistence';
import {
	createActiveTestStore,
	createTestServer,
	makeRequest,
} from '../helpers';

describe('Catalog - Integração', () => {
	let currentStoreBucketKey: string;
	let server: FastifyInstance;
	let storeRepository: InMemoryStoreRepository;

	beforeEach(async () => {
		storeRepository = new InMemoryStoreRepository();
		server = await createTestServer(undefined, { storeRepository });
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
		expect(responsibles.filter((responsible) => responsible.isPrimary)).toEqual(
			[expect.objectContaining({ id: secondId })],
		);

		const remove = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'DELETE',
			url: `/suppliers/${supplierId}/responsibles/${secondId}`,
		});

		expect(remove.statusCode).toBe(204);
	});

	it('deve aplicar busca, status e paginação em fornecedores', async () => {
		const token = await registerAndGetToken();
		await createSupplier(token, {
			name: 'Alpha Moda Teste',
			status: 'active',
		});
		const inactive = await createSupplier(token, {
			name: 'Beta Calçados Teste',
			status: 'inactive',
		});
		await createSupplier(token, {
			name: 'Gamma Acessórios Teste',
			status: 'active',
		});

		const searchResponse = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'GET',
			query: { q: 'beta', status: 'inactive' },
			url: '/suppliers',
		});
		expect(searchResponse.statusCode).toBe(200);
		expect(searchResponse.body).toEqual([
			expect.objectContaining({
				id: (inactive.body as { id: string }).id,
				name: 'Beta Calçados Teste',
				status: 'inactive',
			}),
		]);

		const paginatedResponse = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'GET',
			query: { page: '2', perPage: '1', status: 'active' },
			url: '/suppliers',
		});
		expect(paginatedResponse.statusCode).toBe(200);
		expect(paginatedResponse.body).toHaveLength(1);
	});

	it('deve rejeitar atualização de fornecedor com documento duplicado', async () => {
		const token = await registerAndGetToken();
		const firstDocument = randomUUID().replaceAll('-', '').slice(0, 14);
		const secondDocument = randomUUID().replaceAll('-', '').slice(0, 14);
		await createSupplier(token, {
			document: firstDocument,
			name: 'Fornecedor Documento A',
		});
		const second = await createSupplier(token, {
			document: secondDocument,
			name: 'Fornecedor Documento B',
		});

		const response = await makeRequest(server, {
			body: { document: firstDocument },
			headers: { authorization: `Bearer ${token}` },
			method: 'PATCH',
			url: `/suppliers/${(second.body as { id: string }).id}`,
		});

		expect(response.statusCode).toBe(400);
		expect(response.body).toMatchObject({ code: 'TM-DOM-400' });
	});

	it('deve remover responsáveis vinculados ao excluir fornecedor', async () => {
		const token = await registerAndGetToken();
		const supplier = await createSupplier(token);
		const supplierId = (supplier.body as { id: string }).id;
		await createResponsible(token, supplierId, {
			email: 'remove-responsible@thalya.test',
			isPrimary: true,
			name: 'Responsável Removido',
		});

		const removeSupplier = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'DELETE',
			url: `/suppliers/${supplierId}`,
		});
		expect(removeSupplier.statusCode).toBe(204);

		const responsibles = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'GET',
			url: `/suppliers/${supplierId}/responsibles`,
		});
		expect(responsibles.statusCode).toBe(404);
	});

	it('deve preservar fornecedor e histórico ao tentar excluir com pedidos', async () => {
		const token = await registerAndGetToken();
		const supplier = await createSupplier(token);
		const supplierId = (supplier.body as { id: string }).id;
		const order = await createPurchaseOrder(token, supplierId);
		expect(order.statusCode).toBe(201);

		const removeSupplier = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'DELETE',
			url: `/suppliers/${supplierId}`,
		});
		expect(removeSupplier.statusCode).toBe(400);
		expect(removeSupplier.body).toMatchObject({
			code: 'TM-DOM-400',
			message:
				'Fornecedor possui pedidos ou recebimentos e não pode ser excluído. Inative o cadastro para preservar o histórico.',
		});

		const persistedSupplier = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'GET',
			url: `/suppliers/${supplierId}`,
		});
		const persistedOrders = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'GET',
			url: '/purchase-orders',
		});

		expect(persistedSupplier.statusCode).toBe(200);
		expect(persistedOrders.body).toEqual([
			expect.objectContaining({ supplierId }),
		]);
	});

	it('deve retornar 404 ao alterar responsável de outro fornecedor', async () => {
		const token = await registerAndGetToken();
		const firstSupplier = await createSupplier(token);
		const secondSupplier = await createSupplier(token);
		const firstSupplierId = (firstSupplier.body as { id: string }).id;
		const secondSupplierId = (secondSupplier.body as { id: string }).id;
		const responsible = await createResponsible(token, firstSupplierId);
		const responsibleId = (responsible.body as { id: string }).id;

		const updateFromWrongSupplier = await makeRequest(server, {
			body: { isPrimary: true },
			headers: { authorization: `Bearer ${token}` },
			method: 'PATCH',
			url: `/suppliers/${secondSupplierId}/responsibles/${responsibleId}`,
		});
		const deleteFromWrongSupplier = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'DELETE',
			url: `/suppliers/${secondSupplierId}/responsibles/${responsibleId}`,
		});

		expect(updateFromWrongSupplier.statusCode).toBe(404);
		expect(deleteFromWrongSupplier.statusCode).toBe(404);
	});

	it('deve criar, listar e atualizar pedido de compra', async () => {
		const token = await registerAndGetToken();
		const supplier = await createSupplier(token);
		const product = await createProduct(token);
		const supplierId = (supplier.body as { id: string }).id;
		const productId = (product.body as { id: string }).id;

		const createOrder = await makeRequest(server, {
			body: {
				expectedDeliveryAt: '2026-06-05T15:00:00.000Z',
				invoiceNumber: 'NF-PO-1001',
				items: [
					{
						name: 'Vestido compra teste',
						productId,
						quantity: 3,
						sku: 'PO-VD-001',
						unitCost: 89.9,
					},
				],
				paymentTerm: '+30',
				supplierId,
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/purchase-orders',
		});

		expect(createOrder.statusCode).toBe(201);
		expect(createOrder.body).toMatchObject({
			code: 'PO-0001',
			invoiceNumber: 'NF-PO-1001',
			status: 'confirmed',
			supplierId,
			totalItems: 3,
		});
		expect((createOrder.body as { totalCost: number }).totalCost).toBeCloseTo(
			269.7,
		);

		const listOrders = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'GET',
			query: { q: 'NF-PO-1001', status: 'confirmed' },
			url: '/purchase-orders',
		});
		expect(listOrders.statusCode).toBe(200);
		expect(listOrders.body).toEqual([
			expect.objectContaining({ invoiceNumber: 'NF-PO-1001' }),
		]);

		const orderId = (createOrder.body as { id: string }).id;
		const updateOrder = await makeRequest(server, {
			body: { status: 'receiving' },
			headers: { authorization: `Bearer ${token}` },
			method: 'PATCH',
			url: `/purchase-orders/${orderId}`,
		});
		expect(updateOrder.statusCode).toBe(200);
		expect(updateOrder.body).toMatchObject({ status: 'receiving' });
	});

	it('deve resumir a operação e filtrar históricos por fornecedor', async () => {
		const token = await registerAndGetToken();
		const firstSupplier = await createSupplier(token);
		const secondSupplier = await createSupplier(token);
		const firstSupplierId = (firstSupplier.body as { id: string }).id;
		const secondSupplierId = (secondSupplier.body as { id: string }).id;
		await createResponsible(token, firstSupplierId, { isPrimary: true });

		const firstOrder = await createPurchaseOrder(token, firstSupplierId);
		await createPurchaseOrder(token, secondSupplierId);
		const firstOrderId = (firstOrder.body as { id: string }).id;
		await makeRequest(server, {
			body: { status: 'delayed' },
			headers: { authorization: `Bearer ${token}` },
			method: 'PATCH',
			url: `/purchase-orders/${firstOrderId}`,
		});
		const receiving = await makeRequest(server, {
			body: {
				expectedAt: '2026-06-05T15:00:00.000Z',
				invoiceNumber: 'NF-SUMMARY-001',
				purchaseOrderId: firstOrderId,
				status: 'delayed',
				supplierId: firstSupplierId,
				volumes: 2,
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/receivings',
		});
		expect(receiving.statusCode).toBe(201);

		const summary = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'GET',
			url: '/suppliers/operational-summary',
		});
		expect(summary.statusCode).toBe(200);
		expect(summary.body).toMatchObject({
			activeSuppliers: 2,
			delayedOrders: 1,
			delayedReceivings: 1,
			dueReceivings: 1,
			openOrderValue: 200,
			openOrders: 2,
			suppliersWithResponsible: 1,
			totalSuppliers: 2,
		});

		const firstSupplierOrders = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'GET',
			query: { supplierId: firstSupplierId },
			url: '/purchase-orders',
		});
		const secondSupplierReceivings = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'GET',
			query: { supplierId: secondSupplierId },
			url: '/receivings',
		});
		expect(firstSupplierOrders.body).toEqual([
			expect.objectContaining({ supplierId: firstSupplierId }),
		]);
		expect(secondSupplierReceivings.body).toEqual([]);
	});

	it('deve criar e atualizar recebimento vinculado a pedido de compra', async () => {
		const token = await registerAndGetToken();
		const supplier = await createSupplier(token);
		const supplierId = (supplier.body as { id: string }).id;
		const order = await createPurchaseOrder(token, supplierId);
		const orderId = (order.body as { id: string }).id;

		const createReceiving = await makeRequest(server, {
			body: {
				dock: 'Doca 2',
				expectedAt: '2026-06-05T15:00:00.000Z',
				invoiceNumber: 'NF-REC-1001',
				purchaseOrderId: orderId,
				receiverName: 'Ana Ribeiro',
				supplierId,
				volumes: 4,
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/receivings',
		});
		expect(createReceiving.statusCode).toBe(201);
		expect(createReceiving.body).toMatchObject({
			dock: 'Doca 2',
			invoiceNumber: 'NF-REC-1001',
			itemsCount: 2,
			purchaseOrderId: orderId,
			status: 'scheduled',
		});

		const receivingId = (createReceiving.body as { id: string }).id;
		const updateReceiving = await makeRequest(server, {
			body: {
				receivedAt: '2026-06-05T15:40:00.000Z',
				status: 'completed',
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'PATCH',
			url: `/receivings/${receivingId}`,
		});
		expect(updateReceiving.statusCode).toBe(200);
		expect(updateReceiving.body).toMatchObject({
			receivedAt: '2026-06-05T15:40:00.000Z',
			status: 'completed',
		});

		const listReceivings = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'GET',
			query: { q: 'NF-REC-1001', status: 'completed' },
			url: '/receivings',
		});
		expect(listReceivings.statusCode).toBe(200);
		expect(listReceivings.body).toHaveLength(1);
	});

	it('deve rejeitar pedido e recebimento com vínculos inexistentes', async () => {
		const token = await registerAndGetToken();
		const supplier = await createSupplier(token);
		const supplierId = (supplier.body as { id: string }).id;

		const invalidSupplierOrder = await makeRequest(server, {
			body: {
				expectedDeliveryAt: '2026-06-05T15:00:00.000Z',
				items: [
					{
						name: 'Item invalido',
						quantity: 1,
						sku: 'INV-001',
						unitCost: 10,
					},
				],
				supplierId: randomUUID(),
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/purchase-orders',
		});
		expect(invalidSupplierOrder.statusCode).toBe(404);

		const invalidProductOrder = await makeRequest(server, {
			body: {
				expectedDeliveryAt: '2026-06-05T15:00:00.000Z',
				items: [
					{
						name: 'Item invalido',
						productId: randomUUID(),
						quantity: 1,
						sku: 'INV-002',
						unitCost: 10,
					},
				],
				supplierId,
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/purchase-orders',
		});
		expect(invalidProductOrder.statusCode).toBe(404);

		const invalidReceiving = await makeRequest(server, {
			body: {
				expectedAt: '2026-06-05T15:00:00.000Z',
				invoiceNumber: 'NF-INVALID',
				purchaseOrderId: randomUUID(),
				supplierId,
				volumes: 1,
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/receivings',
		});
		expect(invalidReceiving.statusCode).toBe(404);
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
		const firstUploadKey = (valid.body as { upload: { key: string } }).upload
			.key;
		expect(firstUploadKey).toMatch(
			new RegExp(`^${currentStoreBucketKey}/products/${productId}/`),
		);

		const firstStoreBucketKey = currentStoreBucketKey;
		const secondToken = await registerAndGetToken();
		const secondProduct = await createProduct(secondToken);
		const secondProductId = (secondProduct.body as { id: string }).id;
		const secondUpload = await makeRequest(server, {
			body: {
				contentType: 'image/webp',
				fileName: 'segundo-produto.webp',
				size: 1000,
			},
			headers: { authorization: `Bearer ${secondToken}` },
			method: 'POST',
			url: `/products/${secondProductId}/assets/upload`,
		});
		const secondUploadKey = (secondUpload.body as { upload: { key: string } })
			.upload.key;

		expect(secondUpload.statusCode).toBe(201);
		expect(currentStoreBucketKey).not.toBe(firstStoreBucketKey);
		expect(secondUploadKey).toMatch(
			new RegExp(`^${currentStoreBucketKey}/products/${secondProductId}/`),
		);
		expect(secondUploadKey.startsWith(`${firstStoreBucketKey}/`)).toBe(false);
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

	async function createSupplier(
		token: string,
		overrides: Partial<{
			document: string;
			email: string;
			name: string;
			phone: string;
			status: 'active' | 'inactive';
		}> = {},
	) {
		const response = await makeRequest(server, {
			body: {
				document:
					overrides.document ?? randomUUID().replaceAll('-', '').slice(0, 14),
				email: overrides.email ?? `supplier-${randomUUID()}@thalya.test`,
				name: overrides.name ?? 'Moda Bella Distribuidora',
				phone: overrides.phone ?? '85999998888',
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/suppliers',
		});

		if (overrides.status && response.statusCode === 201) {
			const supplierId = (response.body as { id: string }).id;
			return makeRequest(server, {
				body: { status: overrides.status },
				headers: { authorization: `Bearer ${token}` },
				method: 'PATCH',
				url: `/suppliers/${supplierId}`,
			});
		}

		return response;
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

	async function createPurchaseOrder(token: string, supplierId: string) {
		return makeRequest(server, {
			body: {
				expectedDeliveryAt: '2026-06-05T15:00:00.000Z',
				items: [
					{
						name: 'Pedido auxiliar',
						quantity: 2,
						sku: 'AUX-001',
						unitCost: 50,
					},
				],
				supplierId,
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/purchase-orders',
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

		const body = response.body as {
			token: string;
			user: { id: string };
		};
		const store = await createActiveTestStore(storeRepository, body.user.id);
		currentStoreBucketKey = store.bucketKey;
		return body.token;
	}
});
