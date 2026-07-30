import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	PrismaCatalogRepository,
	PrismaUserRepository,
	prisma,
} from '../../../src/core/infra/persistence';
import { createTestServer, makeRequest } from '../helpers';

const runPrismaTests =
	process.env.RUN_PRISMA_INTEGRATION_TESTS === 'true' &&
	Boolean(process.env.DATABASE_URL);

const testEmailPrefix = 'prisma-catalog';

describe.skipIf(!runPrismaTests)('Catalog - Prisma/Postgres', () => {
	let server: FastifyInstance;

	beforeEach(async () => {
		await cleanupPrismaRecords();
		server = await createTestServer(new PrismaUserRepository(prisma), {
			catalogRepository: new PrismaCatalogRepository(prisma),
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
				sku: 'PRISMA-VD-001',
				supplierId,
			},
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/products',
		});
		expect(productResponse.statusCode).toBe(201);
		const productId = (productResponse.body as { id: string }).id;

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
		});

		const persistedProduct = await prisma.product.findUnique({
			where: { id: productId },
			include: { images: true, movements: true },
		});
		expect(persistedProduct).toMatchObject({
			currentStock: 9,
			sku: 'PRISMA-VD-001',
		});
		expect(persistedProduct?.images).toHaveLength(1);
		expect(persistedProduct?.movements).toHaveLength(1);

		const purchaseOrder = await makeRequest(server, {
			body: {
				expectedDeliveryAt: '2026-06-05T15:00:00.000Z',
				invoiceNumber: 'NF-PRISMA-PO',
				items: [
					{
						name: 'Vestido prisma',
						productId,
						quantity: 2,
						sku: 'PRISMA-VD-001',
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
		expect(persistedPurchaseOrder?.totalCost.toFixed(2)).toBe('155.00');
		expect(persistedPurchaseOrder?.items[0]?.unitCost.toFixed(2)).toBe('77.50');
		expect(persistedPurchaseOrder?.items[0]?.totalCost.toFixed(2)).toBe(
			'155.00',
		);
	});

	it('deve impedir documento e SKU duplicados por usuário', async () => {
		const token = await registerAndGetToken();
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
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/suppliers',
		});
		expect(firstSupplier.statusCode).toBe(201);
		expect(secondSupplier.statusCode).toBe(400);

		const productBody = {
			name: 'Produto Duplicado Prisma',
			sku: 'PRISMA-DUP-001',
		};
		const firstProduct = await makeRequest(server, {
			body: productBody,
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/products',
		});
		const secondProduct = await makeRequest(server, {
			body: productBody,
			headers: { authorization: `Bearer ${token}` },
			method: 'POST',
			url: '/products',
		});
		expect(firstProduct.statusCode).toBe(201);
		expect(secondProduct.statusCode).toBe(400);
	});

	async function registerAndGetToken() {
		const response = await makeRequest(server, {
			body: {
				email: `${testEmailPrefix}-${randomUUID()}@thalya.test`,
				name: 'Prisma Catalog Owner',
				password: 'Secure123',
			},
			method: 'POST',
			url: '/auth/register',
		});

		return (response.body as { token: string }).token;
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
