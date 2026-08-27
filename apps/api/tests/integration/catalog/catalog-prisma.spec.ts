import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	PrismaCatalogRepository,
	PrismaStoreRepository,
	PrismaUserRepository,
	prisma,
} from '../../../src/core/infra/persistence';
import {
	createActiveTestStore,
	createTestServer,
	makeRequest,
} from '../helpers';

const runPrismaTests =
	process.env.RUN_PRISMA_INTEGRATION_TESTS === 'true' &&
	Boolean(process.env.DATABASE_URL);

const testEmailPrefix = 'prisma-catalog';

describe.skipIf(!runPrismaTests)('Catalog - Prisma/Postgres', () => {
	let currentStoreBucketKey: string;
	let currentStoreId: string;
	let currentUserId: string;
	let server: FastifyInstance;
	let storeRepository: PrismaStoreRepository;

	beforeEach(async () => {
		await cleanupPrismaRecords();
		storeRepository = new PrismaStoreRepository(prisma);
		server = await createTestServer(new PrismaUserRepository(prisma), {
			catalogRepository: new PrismaCatalogRepository(prisma),
			storeRepository,
		});
	});

	afterEach(async () => {
		await server.close();
		await cleanupPrismaRecords();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	it('deve persistir fornecedor, responsável, produto, estoque e asset WebP', async () => {
		const token = await registerAndGetToken();

		const supplierResponse = await makeRequest(server, {
			body: {
				category: 'women_fashion',
				deliveryTerm: '+7',
				document: '11222333000144',
				email: 'compras@prisma.test',
				minimumOrder: '1500',
				name: 'Prisma Moda Distribuidora',
				paymentTerm: '+30',
				phone: '85999990000',
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/suppliers',
		});

		expect(supplierResponse.statusCode).toBe(201);
		const supplierId = (supplierResponse.body as { id: string }).id;

		const firstResponsible = await createResponsible(token, supplierId, {
			email: 'carla@prisma.test',
			isPrimary: true,
			name: 'Carla Prisma',
		});
		const secondResponsible = await createResponsible(token, supplierId, {
			email: 'rafael@prisma.test',
			isPrimary: false,
			name: 'Rafael Prisma',
		});
		expect(firstResponsible.statusCode).toBe(201);
		expect(secondResponsible.statusCode).toBe(201);

		const secondResponsibleId = (secondResponsible.body as { id: string }).id;
		const promoteResponsible = await makeRequest(server, {
			body: { isPrimary: true },
			headers: { authorization: `Bearer ${token}` },
			method: 'PATCH',
			url: `/suppliers/${supplierId}/responsibles/${secondResponsibleId}`,
		});
		expect(promoteResponsible.statusCode).toBe(200);

		const responsiblesResponse = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'GET',
			url: `/suppliers/${supplierId}/responsibles`,
		});
		const responsibles = responsiblesResponse.body as Array<{
			id: string;
			isPrimary: boolean;
		}>;
		expect(responsibles.filter((responsible) => responsible.isPrimary)).toEqual(
			[expect.objectContaining({ id: secondResponsibleId })],
		);

		const productResponse = await makeRequest(server, {
			body: {
				currentStock: 5,
				minimumStock: 2,
				name: 'Vestido prisma',
				supplierId,
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/products',
		});
		expect(productResponse.statusCode).toBe(201);
		const { id: productId, sku: productSku } = productResponse.body as {
			id: string;
			sku: string;
		};
		expect(productSku).toMatch(/^PRD-[A-F0-9]{32}$/);

		const adjustmentResponse = await makeRequest(server, {
			body: {
				productId,
				quantity: 4,
				reason: 'Entrada Prisma',
				type: 'in',
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/inventory/adjustments',
		});
		expect(adjustmentResponse.statusCode).toBe(201);
		expect(adjustmentResponse.body).toMatchObject({
			currentStock: 9,
			previousStock: 5,
		});

		const uploadResponse = await makeRequest(server, {
			body: {
				contentType: 'image/webp',
				fileName: 'vestido-prisma.webp',
				size: 1000,
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: `/products/${productId}/assets/upload`,
		});
		expect(uploadResponse.statusCode).toBe(201);
		expect(uploadResponse.body).toMatchObject({
			asset: {
				contentType: 'image/webp',
				fileName: 'vestido-prisma.webp',
				productId,
			},
			upload: {
				key: expect.stringMatching(
					new RegExp(`^${currentStoreBucketKey}/products/${productId}/`),
				),
			},
		});

		const persistedProduct = await prisma.product.findUnique({
			where: { id: productId },
			include: { images: true, movements: true },
		});
		expect(persistedProduct).toMatchObject({
			currentStock: 9,
			sku: productSku,
			storeId: currentStoreId,
		});
		expect(persistedProduct?.images).toHaveLength(1);
		expect(persistedProduct?.movements).toHaveLength(1);
		expect(persistedProduct?.images[0]?.storeId).toBe(currentStoreId);
		expect(persistedProduct?.images[0]?.key).toMatch(
			new RegExp(`^${currentStoreBucketKey}/products/${productId}/`),
		);
		expect(persistedProduct?.movements[0]?.storeId).toBe(currentStoreId);

		const purchaseOrder = await makeRequest(server, {
			body: {
				expectedDeliveryAt: '2026-06-05T15:00:00.000Z',
				invoiceNumber: 'NF-PRISMA-PO',
				items: [
					{
						name: 'Vestido prisma',
						productId,
						quantity: 2,
						sku: productSku,
						unitCost: 77.5,
					},
				],
				supplierId,
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/purchase-orders',
		});
		expect(purchaseOrder.statusCode).toBe(201);
		expect(purchaseOrder.body).toMatchObject({
			code: 'PO-0001',
			totalCost: 155,
			totalItems: 2,
		});

		const purchaseOrderId = (purchaseOrder.body as { id: string }).id;
		const receiving = await makeRequest(server, {
			body: {
				expectedAt: '2026-06-05T15:00:00.000Z',
				invoiceNumber: 'NF-PRISMA-REC',
				purchaseOrderId,
				supplierId,
				volumes: 3,
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/receivings',
		});
		expect(receiving.statusCode).toBe(201);
		expect(receiving.body).toMatchObject({
			itemsCount: 2,
			purchaseOrderId,
			status: 'scheduled',
		});

		const persistedPurchaseOrder = await prisma.purchaseOrder.findUnique({
			where: { id: purchaseOrderId },
			include: { items: true, receivings: true },
		});
		expect(persistedPurchaseOrder?.items).toHaveLength(1);
		expect(persistedPurchaseOrder?.receivings).toHaveLength(1);
		expect(persistedPurchaseOrder?.storeId).toBe(currentStoreId);
		expect(persistedPurchaseOrder?.items[0]?.storeId).toBe(currentStoreId);
		expect(persistedPurchaseOrder?.receivings[0]?.storeId).toBe(currentStoreId);
		expect(persistedPurchaseOrder?.totalCost.toFixed(2)).toBe('155.00');
		expect(persistedPurchaseOrder?.items[0]?.unitCost.toFixed(2)).toBe('77.50');
		expect(persistedPurchaseOrder?.items[0]?.totalCost.toFixed(2)).toBe(
			'155.00',
		);

		const persistedSupplier = await prisma.supplier.findUnique({
			include: { responsibles: true },
			where: { id: supplierId },
		});
		expect(persistedSupplier?.storeId).toBe(currentStoreId);
		expect(
			persistedSupplier?.responsibles.every(
				(responsible) => responsible.storeId === currentStoreId,
			),
		).toBe(true);

		const summary = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'GET',
			url: '/suppliers/operational-summary',
		});
		expect(summary.body).toMatchObject({
			activeSuppliers: 1,
			delayedOrders: 0,
			delayedReceivings: 0,
			dueReceivings: 1,
			openOrderValue: 155,
			openOrders: 1,
			suppliersWithResponsible: 1,
			totalSuppliers: 1,
		});

		const supplierOrders = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'GET',
			query: { supplierId },
			url: '/purchase-orders',
		});
		expect(supplierOrders.body).toEqual([
			expect.objectContaining({ id: purchaseOrderId, supplierId }),
		]);
	});

	it('deve impedir documento duplicado e gerar SKUs distintos na mesma loja', async () => {
		const token = await registerAndGetToken();
		const member = await registerUserOnly();
		await prisma.storeMembership.create({
			data: {
				role: 'MANAGER',
				status: 'ACTIVE',
				storeId: currentStoreId,
				userId: member.userId,
			},
		});
		const supplierBody = {
			document: '99888777000166',
			name: 'Duplicado Prisma',
		};

		const firstSupplier = await makeRequest(server, {
			body: supplierBody,
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/suppliers',
		});
		const secondSupplier = await makeRequest(server, {
			body: supplierBody,
			headers: operationalHeaders(member.token, currentStoreId),
			method: 'POST',
			url: '/suppliers',
		});
		expect(firstSupplier.statusCode).toBe(201);
		expect(secondSupplier.statusCode).toBe(400);

		const productBody = {
			name: 'Produto Duplicado Prisma',
			sku: 'SKU-IGNORADO',
		};
		const firstProduct = await makeRequest(server, {
			body: productBody,
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/products',
		});
		const secondProduct = await makeRequest(server, {
			body: productBody,
			headers: operationalHeaders(member.token, currentStoreId),
			method: 'POST',
			url: '/products',
		});
		expect(firstProduct.statusCode).toBe(201);
		expect(secondProduct.statusCode).toBe(201);
		expect((firstProduct.body as { sku: string }).sku).toMatch(
			/^PRD-[A-F0-9]{32}$/,
		);
		expect((secondProduct.body as { sku: string }).sku).not.toBe(
			(firstProduct.body as { sku: string }).sku,
		);
	});

	it('deve persistir status inicial e prazos comerciais do fornecedor', async () => {
		const token = await registerAndGetToken();
		const response = await makeRequest(server, {
			body: {
				deliveryTerm: '+15',
				document: '66555444000133',
				minimumOrder: '450',
				name: 'Fornecedor Inativo Prisma',
				paymentTerm: '+45',
				status: 'inactive',
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/suppliers',
		});
		expect(response.statusCode).toBe(201);
		const supplierId = (response.body as { id: string }).id;

		const persisted = await prisma.supplier.findUnique({
			where: { id: supplierId },
		});
		expect(persisted).toMatchObject({
			deliveryTerm: '+15',
			paymentTerm: '+45',
			status: 'inactive',
		});
	});

	it('deve impedir exclusão de fornecedor com histórico no PostgreSQL', async () => {
		const token = await registerAndGetToken();
		const supplier = await makeRequest(server, {
			body: {
				document: '55444333000122',
				name: 'Fornecedor com Histórico Prisma',
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/suppliers',
		});
		expect(supplier.statusCode).toBe(201);
		const supplierId = (supplier.body as { id: string }).id;

		const order = await createPurchaseOrder(token, currentStoreId, supplierId);
		expect(order.statusCode).toBe(201);
		const orderId = (order.body as { id: string }).id;

		const removeSupplier = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'DELETE',
			url: `/suppliers/${supplierId}`,
		});

		expect(removeSupplier.statusCode).toBe(400);
		expect(removeSupplier.body).toMatchObject({ code: 'TM-DOM-400' });
		await expect(
			prisma.supplier.findUnique({ where: { id: supplierId } }),
		).resolves.not.toBeNull();
		await expect(
			prisma.purchaseOrder.findUnique({ where: { id: orderId } }),
		).resolves.not.toBeNull();
	});

	it('deve permitir as mesmas chaves operacionais em lojas diferentes', async () => {
		const token = await registerAndGetToken();
		const firstStoreId = currentStoreId;
		const secondStore = await createActiveTestStore(
			storeRepository,
			currentUserId,
			'Segunda loja Prisma',
		);
		const supplierBody = {
			document: '55666777000188',
			name: 'Fornecedor multi-loja',
		};

		const firstSupplier = await makeRequest(server, {
			body: supplierBody,
			headers: operationalHeaders(token, firstStoreId),
			method: 'POST',
			url: '/suppliers',
		});
		const secondSupplier = await makeRequest(server, {
			body: supplierBody,
			headers: operationalHeaders(token, secondStore.id),
			method: 'POST',
			url: '/suppliers',
		});
		expect(firstSupplier.statusCode).toBe(201);
		expect(secondSupplier.statusCode).toBe(201);

		const productBody = {
			name: 'Produto multi-loja',
			sku: 'PRISMA-MULTI-001',
		};
		const firstProduct = await makeRequest(server, {
			body: productBody,
			headers: operationalHeaders(token, firstStoreId),
			method: 'POST',
			url: '/products',
		});
		const secondProduct = await makeRequest(server, {
			body: productBody,
			headers: operationalHeaders(token, secondStore.id),
			method: 'POST',
			url: '/products',
		});
		expect(firstProduct.statusCode).toBe(201);
		expect(secondProduct.statusCode).toBe(201);

		const firstOrder = await createPurchaseOrder(
			token,
			firstStoreId,
			(firstSupplier.body as { id: string }).id,
		);
		const secondOrder = await createPurchaseOrder(
			token,
			secondStore.id,
			(secondSupplier.body as { id: string }).id,
		);
		expect(firstOrder.statusCode).toBe(201);
		expect(secondOrder.statusCode).toBe(201);
		expect(firstOrder.body).toMatchObject({ code: 'PO-0001' });
		expect(secondOrder.body).toMatchObject({ code: 'PO-0001' });
	});

	it('deve manter store_id obrigatório nas oito tabelas operacionais', async () => {
		const columns = await prisma.$queryRaw<
			Array<{ is_nullable: string; table_name: string }>
		>`
			SELECT table_name, is_nullable
			FROM information_schema.columns
			WHERE table_schema = current_schema()
			  AND column_name = 'store_id'
			  AND table_name IN (
			    'suppliers',
			    'supplier_responsibles',
			    'products',
			    'product_image_assets',
			    'inventory_movements',
			    'purchase_orders',
			    'purchase_order_items',
			    'receivings'
			  )
			ORDER BY table_name
		`;

		expect(columns).toHaveLength(8);
		expect(columns.every((column) => column.is_nullable === 'NO')).toBe(true);
	});

	async function registerAndGetToken() {
		const account = await registerUserOnly();
		const store = await createActiveTestStore(storeRepository, account.userId);
		currentStoreBucketKey = store.bucketKey;
		currentStoreId = store.id;
		currentUserId = account.userId;
		return account.token;
	}

	async function registerUserOnly() {
		const response = await makeRequest(server, {
			body: {
				email: `${testEmailPrefix}-${randomUUID()}@thalya.test`,
				name: 'Prisma Catalog Owner',
				password: 'Secure123',
			},
			method: 'POST',
			url: '/auth/register',
		});

		const body = response.body as {
			token: string;
			user: { id: string };
		};
		return { token: body.token, userId: body.user.id };
	}

	function createPurchaseOrder(
		token: string,
		storeId: string,
		supplierId: string,
	) {
		return makeRequest(server, {
			body: {
				expectedDeliveryAt: '2026-08-05T15:00:00.000Z',
				items: [
					{
						name: 'Item multi-loja',
						quantity: 1,
						sku: 'ITEM-MULTI',
						unitCost: 10,
					},
				],
				supplierId,
			},
			headers: operationalHeaders(token, storeId),
			method: 'POST',
			url: '/purchase-orders',
		});
	}

	function operationalHeaders(token: string, storeId: string) {
		return {
			authorization: `Bearer ${token}`,
			'x-store-id': storeId,
		};
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
				name: overrides.name ?? 'Responsável Prisma',
				phone: '85999997777',
				role: 'Comercial',
				status: 'active',
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: `/suppliers/${supplierId}/responsibles`,
		});
	}
});

async function cleanupPrismaRecords() {
	await prisma.user.deleteMany({
		where: { email: { startsWith: testEmailPrefix } },
	});
}
