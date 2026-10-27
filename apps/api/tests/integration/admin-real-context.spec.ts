import { describe, expect, it } from 'vitest';
import {
	AccountStatus,
	StoreSegment,
	StoreStatus,
	UserRole,
} from '../../src/core/domain';
import { JWTService } from '../../src/core/infra/auth/jwt-service';
import { PrismaCatalogRepository } from '../../src/core/infra/persistence/prisma/prisma-catalog-repository';
import { prisma } from '../../src/core/infra/persistence/prisma/prisma-client';
import { PrismaDashboardRepository } from '../../src/core/infra/persistence/prisma/prisma-dashboard-repository';
import { PrismaStoreRepository } from '../../src/core/infra/persistence/prisma/prisma-store-repository';
import { PrismaUserRepository } from '../../src/core/infra/persistence/prisma/prisma-user-repository';
import { env } from '../../src/shared/env';
import { createTestServer } from './helpers/test-server';

describe.skipIf(process.env.RUN_PRISMA_INTEGRATION_TESTS !== 'true')(
	'Real ADMIN context',
	() => {
		it('reads shared persisted records in the active branch and denies other branches', async () => {
			const users = new PrismaUserRepository(prisma);
			const stores = new PrismaStoreRepository(prisma);
			const catalog = new PrismaCatalogRepository(prisma);
			const ids: string[] = [];
			const app = await createTestServer(users, {
				storeRepository: stores,
				catalogRepository: catalog,
				dashboardRepository: new PrismaDashboardRepository(prisma),
			});
			try {
				const createUser = async (role: UserRole) => {
					const user = await users.create({
						name: 'Scoped test',
						email: `scoped-${crypto.randomUUID()}@test.local`,
						passwordHash: 'unused',
						role,
						accountStatus: AccountStatus.ACTIVE,
					});
					ids.push(user.id);
					return user;
				};
				const admin = await createUser(UserRole.ADMIN),
					other = await createUser(UserRole.ADMIN),
					employee = await createUser(UserRole.EMPLOYEE),
					customer = await createUser(UserRole.CUSTOMER);
				const createStore = (ownerId: string) => {
					const slug = crypto.randomUUID();
					return stores.create({
						name: 'Scoped branch',
						ownerId,
						slug,
						bucketKey: `stores/${slug}`,
						document: crypto.randomUUID(),
						phone: '11999999999',
						segment: StoreSegment.MIXED,
						status: StoreStatus.ACTIVE,
					});
				};
				const branch = await createStore(admin.id),
					foreign = await createStore(other.id);
				await stores.addMember(branch.id, employee.id, 'EMPLOYEE');
				const summary = await stores.getPlatformSummary();
				expect(summary.tenants).toBeGreaterThanOrEqual(2);
				expect(summary.activeBranches).toBeGreaterThanOrEqual(2);

				await stores.addMember(branch.id, customer.id, 'CUSTOMER');
				await prisma.customer.create({
					data: {
						id: customer.id,
						storeId: branch.id,
						name: customer.name,
						email: customer.email,
					},
				});
				await catalog.createProduct({
					userId: employee.id,
					storeId: branch.id,
					tenantId: branch.tenantId,
					name: 'Shared product',
					inventoryControl: 'tracked',
					currentStock: 1,
					minimumStock: 2,
					status: 'active',
				});
				await catalog.createProduct({
					userId: other.id,
					storeId: foreign.id,
					tenantId: foreign.tenantId,
					name: 'Foreign product',
					inventoryControl: 'tracked',
					currentStock: 8,
					minimumStock: 1,
					status: 'active',
				});
				const jwt = new JWTService(env.JWT_SECRET);
				const headers = (storeId: string, user = admin) => ({
					authorization: `Bearer ${jwt.generate({ userId: user.id, email: user.email, role: user.role })}`,
					'x-store-id': storeId,
				});
				const overview = await app.inject({
					method: 'GET',
					url: '/dashboard/overview',
					headers: headers(branch.id),
				});
				expect(overview.statusCode).toBe(200);
				expect(overview.json().metrics[0].value).toBe('1');
				expect(overview.json().inventoryRisk.rows[0].product).toBe(
					'Shared product',
				);
				const products = await app.inject({
					method: 'GET',
					url: '/products/page?perPage=1&status=low',
					headers: headers(branch.id),
				});
				expect(products.statusCode).toBe(200);
				expect(products.json()).toMatchObject({
					total: 1,
					items: [{ name: 'Shared product' }],
				});
				const customers = await app.inject({
					method: 'GET',
					url: '/dashboard/customers?page=1&perPage=1',
					headers: headers(branch.id),
				});
				expect(customers.statusCode).toBe(200);
				expect(customers.json()).toMatchObject({
					total: 1,
					customers: [{ id: customer.id }],
				});
				expect(JSON.stringify(customers.json())).not.toContain('passwordHash');
				expect(
					(
						await app.inject({
							method: 'GET',
							url: '/dashboard/overview',
							headers: headers(foreign.id),
						})
					).statusCode,
				).toBe(403);
				expect(
					(
						await app.inject({
							method: 'PATCH',
							url: '/operations/store',
							headers: headers(branch.id, employee),
							payload: { name: 'Denied', phone: '11999999999' },
						})
					).statusCode,
				).toBe(403);
				const saved = await app.inject({
					method: 'PATCH',
					url: '/operations/store',
					headers: headers(branch.id),
					payload: { name: 'Updated branch', phone: '11888888888' },
				});
				expect(saved.statusCode).toBe(200);
				expect((await stores.findById(branch.id))?.name).toBe('Updated branch');
				const missing = await app.inject({
					method: 'GET',
					url: '/dashboard/cash-register',
					headers: headers(branch.id),
				});
				expect(missing.statusCode).toBe(200);
				expect(JSON.stringify(missing.json())).not.toContain('4820');
			} finally {
				await app.close();
				for (const id of ids) await users.delete(id);
			}
		});
	},
);
