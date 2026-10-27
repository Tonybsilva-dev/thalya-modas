import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { CatalogScope } from '../../../src/core/domain/entities/catalog';
import { createStoreBucketKey } from '../../../src/core/domain/value-objects/store-slug';
import {
	PrismaCatalogRepository,
	PrismaStoreRepository,
	PrismaUserRepository,
	prisma,
} from '../../../src/core/infra/persistence';
import { InMemoryCatalogRepository } from '../../../src/core/infra/persistence/in-memory/in-memory-catalog-repository';
import { createActiveTestStore, createTestServer } from '../helpers';

describe.skipIf(
	process.env.RUN_PRISMA_INTEGRATION_TESTS !== 'true' ||
		!process.env.DATABASE_URL,
)('Catalog tenant and branch isolation — PostgreSQL', () => {
	let app: FastifyInstance;
	let repo: PrismaCatalogRepository;
	let scope: CatalogScope;
	let otherScope: CatalogScope;
	let branchId: string;
	let token: string;
	let supplierId: string;
	let productId: string;
	let orderId: string;
	let responsibleId: string;
	const users: string[] = [];
	beforeEach(async () => {
		users.length = 0;
		const stores = new PrismaStoreRepository(prisma);
		repo = new PrismaCatalogRepository(prisma);
		app = await createTestServer(new PrismaUserRepository(prisma), {
			storeRepository: stores,
			catalogRepository: repo,
		});
		async function owner() {
			const response = await app.inject({
				method: 'POST',
				url: '/auth/register',
				payload: {
					name: 'Isolation Owner',
					email: `catalog-isolation-${randomUUID()}@storeflow.test`,
					password: 'Secure123',
				},
			});
			expect(response.statusCode).toBe(201);
			const body = response.json();
			users.push(body.user.id);
			const store = await createActiveTestStore(stores, body.user.id);
			return {
				store,
				token: body.token,
				scope: {
					userId: body.user.id,
					storeId: store.id,
					tenantId: store.tenantId,
				},
			};
		}
		const a = await owner();
		const b = await owner();
		scope = a.scope;
		otherScope = b.scope;
		token = a.token;
		const slug = `isolation-branch-${randomUUID()}`;
		branchId = (
			await stores.create({
				tenantId: scope.tenantId,
				ownerId: scope.userId,
				name: 'Second branch',
				slug,
				bucketKey: createStoreBucketKey(slug),
				document: slug,
				phone: a.store.phone,
				segment: a.store.segment,
				status: a.store.status,
			})
		).id;
		supplierId = (await repo.createSupplier({ ...scope, name: 'Supplier A' }))
			.id;
		productId = (
			await repo.createProduct({
				...scope,
				name: 'Product A',
				supplierId,
				salePrice: 10,
			})
		).id;
		responsibleId = (
			await repo.createSupplierResponsible({
				...scope,
				supplierId,
				name: 'Contact A',
				email: 'contact@example.test',
				phone: '85999990000',
				role: 'Sales',
				contactType: 'orders',
				isPrimary: true,
				status: 'active',
			})
		).id;
		orderId = (
			await repo.createPurchaseOrder({
				...scope,
				supplierId,
				expectedDeliveryAt: '2027-01-01T12:00:00Z',
				items: [
					{ productId, name: 'Product A', sku: 'A', quantity: 1, unitCost: 10 },
				],
			})
		).id;
	});
	afterEach(async () => {
		await app?.close();
		await prisma.user.deleteMany({ where: { id: { in: users } } });
	});
	const headers = (storeId = scope.storeId) => ({
		authorization: `Bearer ${token}`,
		'x-store-id': storeId,
	});

	it('rejects access to another tenant and masks records in another authorized branch', async () => {
		expect(
			(
				await app.inject({
					method: 'GET',
					url: '/suppliers',
					headers: headers(otherScope.storeId),
				})
			).statusCode,
		).toBe(403);
		for (const method of ['GET', 'PATCH', 'DELETE'] as const) {
			const response = await app.inject({
				method,
				url: `/suppliers/${supplierId}`,
				headers: headers(branchId),
				...(method === 'PATCH'
					? { payload: { name: 'Cross branch overwrite' } }
					: {}),
			});
			expect(response.statusCode).toBe(404);
		}
		expect(
			(
				await app.inject({
					method: 'GET',
					url: '/suppliers',
					headers: headers(branchId),
				})
			).json(),
		).toEqual([]);
		expect((await repo.findSupplierById(scope, supplierId))!.name).toBe(
			'Supplier A',
		);
	});
	it('keeps tenant and branch scope server-owned despite forged payload fields', async () => {
		const response = await app.inject({
			method: 'POST',
			url: '/suppliers',
			headers: headers(),
			payload: {
				name: 'Forged scope supplier',
				tenantId: otherScope.tenantId,
				storeId: otherScope.storeId,
				userId: otherScope.userId,
			},
		});
		expect(response.statusCode).toBe(201);
		const saved = await prisma.supplier.findUniqueOrThrow({
			where: { id: response.json().id },
		});
		expect(saved.storeId).toBe(scope.storeId);
		expect(saved.userId).toBe(scope.userId);
		expect(await repo.findSupplierById(otherScope, saved.id)).toBeNull();
	});
	it('rejects cross-branch contacts and product, purchase and receiving relationships', async () => {
		const foreignSupplier = await repo.createSupplier({
			...scope,
			storeId: branchId,
			name: 'Supplier branch B',
		});
		const foreignProduct = await repo.createProduct({
			...scope,
			storeId: branchId,
			name: 'Product branch B',
		});
		await expect(
			repo.updateSupplierResponsible({
				...scope,
				supplierId: foreignSupplier.id,
				id: responsibleId,
				name: 'Invalid contact',
			}),
		).rejects.toThrow();
		await expect(
			repo.createProduct({
				...scope,
				name: 'Invalid product',
				supplierId: foreignSupplier.id,
			}),
		).rejects.toThrow();
		await expect(
			repo.createPurchaseOrder({
				...scope,
				supplierId,
				expectedDeliveryAt: '2027-01-01T12:00:00Z',
				items: [
					{
						productId: foreignProduct.id,
						name: 'Invalid',
						sku: 'X',
						quantity: 1,
						unitCost: 1,
					},
				],
			}),
		).rejects.toThrow();
		const anotherSupplier = await repo.createSupplier({
			...scope,
			name: 'Another supplier in A',
		});
		await expect(
			repo.createReceiving({
				...scope,
				supplierId: anotherSupplier.id,
				purchaseOrderId: orderId,
				invoiceNumber: 'Invalid supplier',
				expectedAt: '2027-01-01T12:00:00Z',
				volumes: 1,
			}),
		).rejects.toThrow();
	});
	it('refuses missing context and mismatched tenant/branch even for direct repository calls', async () => {
		const forged = { ...scope, tenantId: otherScope.tenantId };
		const memory = new InMemoryCatalogRepository(
			new PrismaStoreRepository(prisma),
		);
		await expect(memory.listSuppliers(forged)).rejects.toThrow('Filial fora');
		await expect(
			memory.createSupplier({ ...forged, name: 'Invalid memory context' }),
		).rejects.toThrow('Filial fora');
		await expect(
			repo.prepareProductImageUpload({
				...scope,
				productId,
				storeBucketKey: 'another-branch',
				fileName: 'image.webp',
				contentType: 'image/webp',
				size: 100,
			}),
		).rejects.toThrow('Destino de arquivos');
		await expect(repo.listSuppliers(forged)).rejects.toThrow('Filial fora');
		await expect(
			repo.updateSupplier({ ...forged, id: supplierId, name: 'Invalid' }),
		).rejects.toThrow('Filial fora');
		await expect(
			repo.createSupplier({ ...forged, name: 'Invalid' }),
		).rejects.toThrow('Filial fora');
		await expect(
			repo.listSuppliers({
				...scope,
				tenantId: undefined,
			} as unknown as CatalogScope),
		).rejects.toThrow('Contexto');
	});
	it('prevents cross-branch links at the database boundary, bypassing repositories', async () => {
		const base = { userId: scope.userId, storeId: otherScope.storeId };
		await expect(
			prisma.supplierResponsible.create({
				data: {
					...base,
					supplierId,
					name: 'Invalid',
					email: 'invalid@example.test',
					phone: '85999990000',
					role: 'Sales',
					contactType: 'orders',
					status: 'active',
				},
			}),
		).rejects.toThrow('Supplier outside');
		await expect(
			prisma.product.create({
				data: {
					...base,
					supplierId,
					name: 'Invalid',
					sku: randomUUID(),
					status: 'active',
				},
			}),
		).rejects.toThrow('Supplier outside');
		await expect(
			prisma.inventoryMovement.create({
				data: {
					...base,
					productId,
					type: 'in',
					quantity: 1,
					previousStock: 0,
					currentStock: 1,
					reason: 'Invalid',
				},
			}),
		).rejects.toThrow('Product outside');
		await expect(
			prisma.productImageAsset.create({
				data: {
					...base,
					productId,
					fileName: 'invalid.webp',
					contentType: 'image/webp',
					key: 'invalid',
					size: 1,
				},
			}),
		).rejects.toThrow('Product outside');
		await expect(
			prisma.purchaseOrder.create({
				data: {
					...base,
					supplierId,
					code: randomUUID(),
					expectedDeliveryAt: new Date(),
					status: 'draft',
					totalCost: 1,
					totalItems: 1,
				},
			}),
		).rejects.toThrow('Supplier outside');
		await expect(
			prisma.purchaseOrderItem.create({
				data: {
					...base,
					purchaseOrderId: orderId,
					name: 'Invalid',
					sku: 'X',
					quantity: 1,
					unitCost: 1,
					totalCost: 1,
				},
			}),
		).rejects.toThrow('Purchase order outside');
		await expect(
			prisma.receiving.create({
				data: {
					...base,
					supplierId,
					purchaseOrderId: orderId,
					invoiceNumber: 'Invalid',
					expectedAt: new Date(),
					volumes: 1,
					status: 'scheduled',
					itemsCount: 1,
				},
			}),
		).rejects.toThrow('Supplier outside');
		const localSupplier = await repo.createSupplier({
			...scope,
			name: 'Other local supplier',
		});
		await expect(
			prisma.receiving.create({
				data: {
					userId: scope.userId,
					storeId: scope.storeId,
					supplierId: localSupplier.id,
					purchaseOrderId: orderId,
					invoiceNumber: 'Invalid local relationship',
					expectedAt: new Date(),
					volumes: 1,
					status: 'scheduled',
					itemsCount: 1,
				},
			}),
		).rejects.toThrow('Receiving outside');
	});
	it('prevents moving existing catalog records to another tenant or branch', async () => {
		await expect(
			prisma.supplier.update({
				where: { id: supplierId },
				data: { storeId: otherScope.storeId },
			}),
		).rejects.toThrow('scope is immutable');
		await expect(
			prisma.product.update({
				where: { id: productId },
				data: { storeId: branchId },
			}),
		).rejects.toThrow('scope is immutable');
		await expect(
			prisma.purchaseOrder.update({
				where: { id: orderId },
				data: { storeId: branchId },
			}),
		).rejects.toThrow('scope is immutable');
		expect((await repo.findSupplierById(scope, supplierId))!.storeId).toBe(
			scope.storeId,
		);
	});
});
