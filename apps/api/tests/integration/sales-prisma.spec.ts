import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	businessDate,
	installmentStatus,
	SalesService,
} from '../../src/core/application/sales';
import { UserRole } from '../../src/core/domain/entities/user';
import { JWTService } from '../../src/core/infra/auth/jwt-service';
import {
	PrismaCatalogRepository,
	PrismaStoreRepository,
	PrismaUserRepository,
	prisma,
} from '../../src/core/infra/persistence';
import { PrismaCustomerRepository } from '../../src/core/infra/persistence/prisma/prisma-customer-repository';
import { env } from '../../src/shared/env';
import { createActiveTestStore, createTestServer } from './helpers';

describe('Receivable due dates', () => {
	it('uses an agreed due date and remaining balance, including Fortaleza midnight', () => {
		expect(businessDate(new Date('2026-02-01T02:59:00Z'))).toBe('2026-01-31');
		expect(businessDate(new Date('2026-02-01T03:00:00Z'))).toBe('2026-02-01');
		expect(installmentStatus(1000, 1000, '2026-01-01', '2026-02-01')).toBe(
			'PAID',
		);
		expect(installmentStatus(1000, 500, '2026-01-31', '2026-02-01')).toBe(
			'OVERDUE',
		);
		expect(installmentStatus(1000, 0, '2026-02-01', '2026-02-01')).toBe('OPEN');
	});
});

describe.skipIf(
	process.env.RUN_PRISMA_INTEGRATION_TESTS !== 'true' ||
		!process.env.DATABASE_URL,
)('Sales, cash and receivables — PostgreSQL', () => {
	let app: FastifyInstance;
	let ownerId: string;
	let scope: { userId: string; storeId: string };
	let token: string;
	let customerId: string;
	let productId: string;
	let service: SalesService;
	const headers = () => ({
		authorization: `Bearer ${token}`,
		'X-Store-Id': scope.storeId,
	});
	const sale = (quantity = 1) => ({
		requestKey: randomUUID(),
		customerId,
		items: [{ productId, quantity }],
		installments: [{ dueDate: '2026-01-15', amountCents: quantity * 1250 }],
	});
	beforeEach(async () => {
		service = new SalesService(prisma);
		const stores = new PrismaStoreRepository(prisma);
		app = await createTestServer(new PrismaUserRepository(prisma), {
			storeRepository: stores,
			catalogRepository: new PrismaCatalogRepository(prisma),
			customerRepository: new PrismaCustomerRepository(prisma),
			sales: service,
		});
		const registration = await app.inject({
			method: 'POST',
			url: '/auth/register',
			payload: {
				name: 'Sales Test Owner',
				email: `sales-${randomUUID()}@storeflow.test`,
				password: 'Secure123',
			},
		});
		expect(registration.statusCode).toBe(201);
		const account = registration.json();
		ownerId = account.user.id;
		token = account.token;
		const store = await createActiveTestStore(stores, ownerId);
		scope = { userId: ownerId, storeId: store.id };
		customerId = (
			await prisma.customer.create({
				data: { storeId: store.id, name: 'Cliente de janeiro' },
			})
		).id;
		productId = (
			await prisma.product.create({
				data: {
					...scope,
					name: 'Produto teste',
					sku: randomUUID(),
					salePrice: '12.50',
					status: 'active',
					currentStock: 5,
				},
			})
		).id;
	});
	afterEach(async () => {
		await app?.close();
		if (ownerId) {
			// Receipts restrict session deletion; clear only this fixture's records.
			await prisma.saleOrder.deleteMany({ where: { storeId: scope.storeId } });
			await prisma.cashSession.deleteMany({
				where: { storeId: scope.storeId },
			});
			const store = await prisma.store.findUnique({
				where: { id: scope.storeId },
			});
			if (store) await prisma.tenant.delete({ where: { id: store.tenantId } });
			await prisma.user.delete({ where: { id: ownerId } });
		}
	});
	it('persists separate orders, snapshots, partial receipts and cash reconciliation through HTTP', async () => {
		const opened = await app.inject({
			method: 'POST',
			url: '/cash-register/open',
			headers: headers(),
			payload: { openingCents: 1000 },
		});
		expect(opened.statusCode).toBe(200);
		const input = {
			...sale(2),
			payment: { amountCents: 500, method: 'CASH' as const },
		};
		const response = await app.inject({
			method: 'POST',
			url: '/sales/orders',
			headers: headers(),
			payload: input,
		});
		expect(response.statusCode).toBe(201);
		const first = response.json();
		expect(first.installments[0].paidCents).toBe(500);
		expect(
			(
				await app.inject({
					method: 'POST',
					url: '/sales/orders',
					headers: headers(),
					payload: input,
				})
			).json().id,
		).toBe(first.id);
		await prisma.product.update({
			where: { id: productId },
			data: { name: 'Nome alterado', salePrice: '25.00' },
		});
		expect(
			(await service.detail(scope.storeId, first.id)).items[0]!.unitPriceCents,
		).toBe(1250);
		expect((await service.detail(scope.storeId, first.id)).items[0]!.name).toBe(
			'Produto teste',
		);
		const second = await service.create(scope, {
			...sale(),
			installments: [{ dueDate: '2026-02-15', amountCents: 2500 }],
		});
		expect(second.id).not.toBe(first.id);
		const pay = { requestKey: randomUUID(), amountCents: 1000, method: 'PIX' };
		const receipt = await app.inject({
			method: 'POST',
			url: `/receivables/${first.installments[0].id}/payments`,
			headers: headers(),
			payload: pay,
		});
		expect(receipt.statusCode).toBe(200);
		await service.pay(scope, first.installments[0].id, pay);
		const account = await service.account(scope.storeId, customerId);
		expect(account.balanceCents).toBe(3500);
		expect(account.overdueCents).toBe(3500);
		expect(
			(await prisma.product.findUniqueOrThrow({ where: { id: productId } }))
				.currentStock,
		).toBe(2);
		expect((await service.cash(scope.storeId)).current!.expectedCents).toBe(
			1500,
		);
		const closedResponse = await app.inject({
			method: 'POST',
			url: `/cash-register/${opened.json().id}/close`,
			headers: headers(),
			payload: { countedCents: 1450, notes: 'Conferência de teste' },
		});
		expect(closedResponse.statusCode).toBe(200);
		const closed = closedResponse.json();
		expect(closed.expectedCents).toBe(1500);
		expect(closed.countedCents).toBe(1450);
		await expect(
			service.pay(scope, first.installments[0].id, {
				...pay,
				requestKey: randomUUID(),
				amountCents: 100,
			}),
		).rejects.toThrow('Abra o caixa');
	});
	it('rolls back the entire sale when any tracked line has insufficient stock', async () => {
		const other = await prisma.product.create({
			data: {
				...scope,
				name: 'Sem estoque',
				sku: randomUUID(),
				salePrice: '12.50',
				status: 'active',
				currentStock: 0,
			},
		});
		await expect(
			service.create(scope, {
				...sale(),
				items: [
					{ productId, quantity: 1 },
					{ productId: other.id, quantity: 1 },
				],
				installments: [{ dueDate: '2026-01-15', amountCents: 2500 }],
			}),
		).rejects.toThrow('Estoque insuficiente');
		expect(
			(await prisma.product.findUniqueOrThrow({ where: { id: productId } }))
				.currentStock,
		).toBe(5);
		expect(
			await prisma.saleOrder.count({ where: { storeId: scope.storeId } }),
		).toBe(0);
		expect(
			await prisma.inventoryMovement.count({
				where: { storeId: scope.storeId },
			}),
		).toBe(0);
	});
	it('serializes concurrent sales and concurrent payments, preventing negative stock or overpayment', async () => {
		const outcomes = await Promise.allSettled([
			service.create(scope, sale(4)),
			service.create(scope, sale(4)),
		]);
		expect(outcomes.filter((item) => item.status === 'fulfilled')).toHaveLength(
			1,
		);
		expect(
			(await prisma.product.findUniqueOrThrow({ where: { id: productId } }))
				.currentStock,
		).toBe(1);
		const order = (await service.list(scope.storeId, { page: 1, perPage: 20 }))
			.items[0]!;
		await service.open(scope, 0);
		const payments = await Promise.allSettled(
			[1, 2].map(() =>
				service.pay(scope, order.installments[0]!.id, {
					requestKey: randomUUID(),
					amountCents: 4000,
					method: 'PIX',
				}),
			),
		);
		expect(payments.filter((item) => item.status === 'fulfilled')).toHaveLength(
			1,
		);
		expect(
			(await service.account(scope.storeId, customerId)).balanceCents,
		).toBe(1000);
	});
	it('supports untracked products and cancels an unpaid order once, restoring only tracked stock', async () => {
		const untracked = await prisma.product.create({
			data: {
				...scope,
				name: 'Avulso',
				sku: randomUUID(),
				salePrice: '5.00',
				inventoryControl: 'untracked',
				status: 'active',
			},
		});
		const order = await service.create(scope, {
			...sale(),
			items: [
				{ productId, quantity: 2 },
				{ productId: untracked.id, quantity: 10 },
			],
			installments: [{ dueDate: '2026-02-15', amountCents: 7500 }],
		});
		await service.cancel(scope, order.id, 'Pedido lançado incorretamente');
		await service.cancel(scope, order.id, 'Pedido lançado incorretamente');
		expect(
			(await prisma.product.findUniqueOrThrow({ where: { id: productId } }))
				.currentStock,
		).toBe(5);
		expect(
			(await prisma.product.findUniqueOrThrow({ where: { id: untracked.id } }))
				.currentStock,
		).toBe(0);
		expect(
			(await service.account(scope.storeId, customerId)).balanceCents,
		).toBe(0);
		expect(
			await prisma.inventoryMovement.count({
				where: { storeId: scope.storeId },
			}),
		).toBe(2);
	});
	it('isolates store records and rejects invalid dates, anonymous debt and unauthorized mutations', async () => {
		const order = await service.create(scope, sale());
		expect(
			(
				await app.inject({
					method: 'GET',
					url: `/sales/orders/${order.id}`,
					headers: { ...headers(), 'X-Store-Id': randomUUID() },
				})
			).statusCode,
		).toBe(403);
		expect(
			(
				await app.inject({
					method: 'POST',
					url: '/sales/orders',
					headers: headers(),
					payload: {
						...sale(),
						installments: [{ dueDate: '2026-02-30', amountCents: 1250 }],
					},
				})
			).statusCode,
		).toBe(400);
		expect(
			(
				await app.inject({
					method: 'POST',
					url: '/sales/orders',
					headers: headers(),
					payload: { ...sale(), customerId: undefined },
				})
			).statusCode,
		).toBe(400);
		expect(
			(await app.inject({ method: 'GET', url: '/cash-register' })).statusCode,
		).toBe(401);
		const other = await createActiveTestStore(
			new PrismaStoreRepository(prisma),
			ownerId,
			'Outra filial',
		);
		try {
			await expect(service.detail(other.id, order.id)).rejects.toThrow(
				'não encontrado',
			);
			await expect(
				service.pay(
					{ ...scope, storeId: other.id },
					order.installments[0]!.id,
					{ requestKey: randomUUID(), amountCents: 100, method: 'CASH' },
				),
			).rejects.toThrow('não encontrada');
		} finally {
			await prisma.store.delete({ where: { id: other.id } });
		}
	});
	it('prevents duplicate open cash sessions and withdrawals beyond cash on hand', async () => {
		const results = await Promise.allSettled([
			service.open(scope, 100),
			service.open(scope, 100),
		]);
		expect(
			results.filter((result) => result.status === 'fulfilled'),
		).toHaveLength(1);
		await expect(
			service.move(scope, {
				requestKey: randomUUID(),
				kind: 'WITHDRAWAL',
				amountCents: 101,
				reason: 'Sangria de teste',
			}),
		).rejects.toThrow('maior que o saldo');
		const movement = {
			requestKey: randomUUID(),
			kind: 'SUPPLY' as const,
			amountCents: 50,
			reason: 'Reforço do troco',
		};
		await service.move(scope, movement);
		await service.move(scope, movement);
		expect((await service.cash(scope.storeId)).current!.expectedCents).toBe(
			150,
		);
		const current = (await service.cash(scope.storeId)).current!;
		await service.close(scope, current.id, 150);
		await service.open(scope, 0);
		await service.move(scope, movement);
		expect((await service.cash(scope.storeId)).current!.expectedCents).toBe(0);
	});
	it('permits employees to sell and receive, but reserves cash management and cancellations to managers', async () => {
		const employee = await prisma.user.create({
			data: {
				name: 'Sales Employee',
				email: `sales-employee-${randomUUID()}@storeflow.test`,
				passwordHash: 'unused',
				role: UserRole.EMPLOYEE,
				accountStatus: 'ACTIVE',
			},
		});
		const stores = new PrismaStoreRepository(prisma);
		await stores.addMember(scope.storeId, employee.id, 'EMPLOYEE');
		const employeeToken = new JWTService(
			env.JWT_SECRET,
			env.JWT_EXPIRES_IN,
		).generate({
			userId: employee.id,
			email: employee.email,
			role: UserRole.EMPLOYEE,
		});
		const employeeHeaders = {
			...headers(),
			authorization: `Bearer ${employeeToken}`,
		};
		try {
			const opened = await app.inject({
				method: 'POST',
				url: '/cash-register/open',
				headers: employeeHeaders,
				payload: { openingCents: 1000 },
			});
			expect(opened.statusCode).toBe(200);
			const created = await app.inject({
				method: 'POST',
				url: '/sales/orders',
				headers: employeeHeaders,
				payload: sale(),
			});
			expect(created.statusCode).toBe(201);
			const received = await app.inject({
				method: 'POST',
				url: `/receivables/${created.json().installments[0].id}/payments`,
				headers: employeeHeaders,
				payload: { requestKey: randomUUID(), amountCents: 100, method: 'PIX' },
			});
			expect(received.statusCode).toBe(200);
			expect(
				(
					await app.inject({
						method: 'POST',
						url: '/cash-register/movements',
						headers: employeeHeaders,
						payload: {
							requestKey: randomUUID(),
							amountCents: 100,
							kind: 'WITHDRAWAL',
							reason: 'Tentativa de sangria',
						},
					})
				).statusCode,
			).toBe(403);
			expect(
				(
					await app.inject({
						method: 'POST',
						url: `/sales/orders/${created.json().id}/cancel`,
						headers: employeeHeaders,
						payload: { reason: 'Tentativa de cancelamento' },
					})
				).statusCode,
			).toBe(403);
			expect(
				(
					await app.inject({
						method: 'POST',
						url: `/cash-register/${opened.json().id}/close`,
						headers: employeeHeaders,
						payload: { countedCents: 1000 },
					})
				).statusCode,
			).toBe(403);
			const manager = await prisma.user.update({
				where: { id: employee.id },
				data: { role: UserRole.MANAGER },
			});
			await stores.updateMemberRoles(manager.id, 'MANAGER');
			const managerToken = new JWTService(
				env.JWT_SECRET,
				env.JWT_EXPIRES_IN,
			).generate({
				userId: manager.id,
				email: manager.email,
				role: UserRole.MANAGER,
			});
			expect(
				(
					await app.inject({
						method: 'POST',
						url: `/cash-register/${opened.json().id}/close`,
						headers: { ...headers(), authorization: `Bearer ${managerToken}` },
						payload: { countedCents: 1000 },
					})
				).statusCode,
			).toBe(200);
		} finally {
			await prisma.user.delete({ where: { id: employee.id } });
		}
	});
});
