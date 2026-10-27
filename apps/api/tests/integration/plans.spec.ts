import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PlanAccessService } from '../../src/core/application/plan-access';
import {
	AccountStatus,
	StoreSegment,
	StoreStatus,
	UserRole,
} from '../../src/core/domain';
import {
	DEFAULT_PLAN_ID,
	defaultPlanFlags,
	operationalFeature,
} from '../../src/core/domain/feature-catalog';
import { JWTService } from '../../src/core/infra/auth/jwt-service';
import { InMemoryPlanRepository } from '../../src/core/infra/persistence/in-memory/in-memory-plan-repository';
import { InMemoryStoreRepository } from '../../src/core/infra/persistence/in-memory/in-memory-store-repository';
import { InMemoryUserRepository } from '../../src/core/infra/persistence/in-memory/in-memory-user-repository';
import { env } from '../../src/shared/env';
import { createTestServer } from './helpers/test-server';

describe('Plans, modules and kill switches', () => {
	let app: FastifyInstance;
	let plans: InMemoryPlanRepository;
	let tenantId: string;
	let rootHeaders: Record<string, string>;
	let adminHeaders: Record<string, string>;
	beforeEach(async () => {
		plans = new InMemoryPlanRepository();
		const users = new InMemoryUserRepository();
		const stores = new InMemoryStoreRepository();
		const root = await users.create({
			name: 'Platform Test',
			email: 'root@plan.test',
			passwordHash: 'unused',
			role: UserRole.SUPER_ADMIN,
			accountStatus: AccountStatus.ACTIVE,
		});
		const admin = await users.create({
			name: 'Company Test',
			email: 'admin@plan.test',
			passwordHash: 'unused',
			role: UserRole.ADMIN,
			accountStatus: AccountStatus.ACTIVE,
		});
		const store = await stores.create({
			ownerId: admin.id,
			name: 'Plan Branch',
			slug: 'plan-branch',
			bucketKey: 'stores/plan-branch',
			phone: '85999999999',
			document: '12345678901',
			segment: StoreSegment.MIXED,
			status: StoreStatus.ACTIVE,
		});
		tenantId = store.tenantId;
		const jwt = new JWTService(env.JWT_SECRET);
		const headers = (user: typeof root) => ({
			authorization: `Bearer ${jwt.generate({ userId: user.id, email: user.email, role: user.role })}`,
			'X-Store-Id': store.id,
		});
		rootHeaders = headers(root);
		adminHeaders = headers(admin);
		app = await createTestServer(users, {
			storeRepository: stores,
			planRepository: plans,
		});
	});
	afterEach(async () => app.close());
	const audit = {
		actorId: 'test',
		targetId: 'test',
		action: 'TEST',
		reason: 'test reason',
		changes: {},
	};
	it('exposes aggregate SaaS indicators only to SUPER_ADMIN', async () => {
		await plans.setTenantPlan(
			tenantId,
			{ planId: DEFAULT_PLAN_ID, overrides: {} },
			audit,
		);
		const response = await app.inject({
			method: 'GET',
			url: '/admin/analytics',
			headers: rootHeaders,
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().summary).toMatchObject({
			tenants: 1,
			activeTenants: 1,
			branches: 1,
			activeBranches: 1,
			tenantsWithoutBranches: 0,
		});
		expect(
			response
				.json()
				.plans.items.find((plan: { id: string }) => plan.id === DEFAULT_PLAN_ID)
				.tenants,
		).toBe(1);
		expect(
			(
				await app.inject({
					method: 'GET',
					url: '/admin/analytics',
					headers: adminHeaders,
				})
			).statusCode,
		).toBe(403);
		expect(
			(await app.inject({ method: 'GET', url: '/admin/analytics' })).statusCode,
		).toBe(401);
	});
	it('explains the effective company plan without leaking global controls or overrides', async () => {
		await plans.setTenantPlan(
			tenantId,
			{ planId: DEFAULT_PLAN_ID, overrides: { 'catalog.products': false } },
			audit,
		);
		await plans.setControls(
			{ maintenance: true, disabledKeys: ['inventory'] },
			audit,
		);
		const response = await app.inject({
			method: 'GET',
			url: '/operations/plan',
			headers: adminHeaders,
		});
		expect(response.statusCode).toBe(200);
		expect(response.json()).toMatchObject({
			tenantId,
			maintenance: true,
			plan: { id: DEFAULT_PLAN_ID },
		});
		expect(response.json()).not.toHaveProperty('overrides');
		expect(response.json()).not.toHaveProperty('controls');
		expect(
			response
				.json()
				.features.every(
					(feature: { reason: string }) => feature.reason === 'MAINTENANCE',
				),
		).toBe(true);
		expect(
			(
				await app.inject({
					method: 'GET',
					url: '/operations/plan',
					headers: { ...adminHeaders, 'X-Store-Id': crypto.randomUUID() },
				})
			).statusCode,
		).toBe(403);
	});
	it('grants implemented sales and finance features when company overrides enable them', async () => {
		await plans.setTenantPlan(
			tenantId,
			{
				planId: DEFAULT_PLAN_ID,
				overrides: {
					'sales.orders': true,
					'finance.cash': true,
					'finance.receivables': true,
				},
			},
			audit,
		);
		const response = await app.inject({
			method: 'GET',
			url: '/operations/plan',
			headers: adminHeaders,
		});
		for (const key of ['sales.orders', 'finance.cash', 'finance.receivables']) {
			expect(
				response
					.json()
					.features.find((feature: { key: string }) => feature.key === key),
			).toMatchObject({ enabled: true });
		}
		expect(
			response
				.json()
				.features.find(
					(feature: { key: string }) => feature.key === 'sales.customers',
				).enabled,
		).toBe(true);
	});
	it('paginates and filters platform audit and denies tenant admins', async () => {
		const actorId = crypto.randomUUID();
		for (let index = 0; index < 3; index++)
			await plans.recordAudit({
				...audit,
				actorId,
				targetId: tenantId,
				action: 'TENANT_UPDATED',
				changes: { after: { name: `Company ${index}` } },
			});
		await plans.recordAudit({
			...audit,
			actorId,
			targetId: crypto.randomUUID(),
			action: 'PLAN_UPDATED',
		});
		const response = await app.inject({
			method: 'GET',
			url: `/admin/audit?targetId=${tenantId}&action=TENANT_UPDATED&actorId=${actorId}&page=2&perPage=2`,
			headers: rootHeaders,
		});
		expect(response.statusCode).toBe(200);
		expect(response.json()).toMatchObject({ total: 3, page: 2, totalPages: 2 });
		expect(response.json().items).toHaveLength(1);
		expect(response.json().items[0].changes.after.name).toBe('Company 0');
		const actors = await app.inject({
			method: 'GET',
			url: '/admin/audit/actors',
			headers: rootHeaders,
		});
		expect(actors.statusCode).toBe(200);
		expect(
			actors.json().filter((actor: { id: string }) => actor.id === actorId),
		).toEqual([{ id: actorId, name: 'Conta removida' }]);
		expect(
			(
				await app.inject({
					method: 'GET',
					url: '/admin/audit',
					headers: adminHeaders,
				})
			).statusCode,
		).toBe(403);
		for (const query of [
			'page=0',
			'perPage=101',
			'actorId=invalid',
			'from=invalid',
			'from=2026-10-05T00:00:00Z&to=2026-10-04T00:00:00Z',
		])
			expect(
				(
					await app.inject({
						method: 'GET',
						url: `/admin/audit?${query}`,
						headers: rootHeaders,
					})
				).statusCode,
			).toBe(400);
	});
	it('audits company changes and branch creation with before and after values', async () => {
		const update = await app.inject({
			method: 'PATCH',
			url: `/tenants/${tenantId}`,
			headers: rootHeaders,
			payload: {
				name: 'Audited Company',
				status: 'SUSPENDED',
				reason: 'Administrative review',
			},
		});
		expect(update.statusCode).toBe(200);
		const branch = await app.inject({
			method: 'POST',
			url: `/tenants/${tenantId}/stores`,
			headers: rootHeaders,
			payload: {
				name: 'Audited Branch',
				phone: '85999999999',
				document: '98765432101',
				segment: 'mixed',
			},
		});
		expect(branch.statusCode).toBe(201);
		const history = (
			await app.inject({
				method: 'GET',
				url: `/admin/audit?targetId=${tenantId}`,
				headers: rootHeaders,
			})
		).json();
		expect(history.total).toBe(2);
		expect(
			history.items.find(
				(row: { action: string }) => row.action === 'TENANT_UPDATED',
			),
		).toMatchObject({
			reason: 'Administrative review',
			changes: {
				before: { status: 'ACTIVE' },
				after: { name: 'Audited Company', status: 'SUSPENDED' },
			},
		});
		expect(
			history.items.find(
				(row: { action: string }) => row.action === 'BRANCH_CREATED',
			).changes.branchId,
		).toBe(branch.json().id);
	});
	it('lists only company members and audits user edits without password hashes', async () => {
		const members = await app.inject({
			method: 'GET',
			url: `/admin/tenants/${tenantId}/users`,
			headers: rootHeaders,
		});
		expect(members.statusCode).toBe(200);
		expect(members.json().items).toHaveLength(1);
		expect(JSON.stringify(members.json())).not.toContain('passwordHash');
		const id = members.json().items[0].id;
		const changed = await app.inject({
			method: 'PATCH',
			url: `/users/${id}`,
			headers: rootHeaders,
			payload: { name: 'Edited Administrator' },
		});
		expect(changed.statusCode).toBe(200);
		const history = (
			await app.inject({
				method: 'GET',
				url: `/admin/audit?targetId=${id}`,
				headers: rootHeaders,
			})
		).json();
		expect(history.total).toBe(1);
		expect(history.items[0].changes.after.name).toBe('Edited Administrator');
		expect(JSON.stringify(history)).not.toContain('passwordHash');
		expect(
			(
				await app.inject({
					method: 'GET',
					url: `/admin/tenants/${tenantId}/users`,
					headers: adminHeaders,
				})
			).statusCode,
		).toBe(403);
	});
	it('restricts plan and control management to SUPER_ADMIN', async () => {
		for (const url of [
			'/admin/plans',
			'/admin/features',
			'/admin/controls',
			'/admin/plan-audit',
			'/admin/audit/actors',
		])
			expect(
				(await app.inject({ method: 'GET', url, headers: adminHeaders }))
					.statusCode,
			).toBe(403);
		expect(
			(
				await app.inject({
					method: 'GET',
					url: '/admin/plans',
					headers: rootHeaders,
				})
			).statusCode,
		).toBe(200);
	});
	it('preserves access through the default plan', async () => {
		expect(
			(
				await app.inject({
					method: 'GET',
					url: '/products',
					headers: adminHeaders,
				})
			).statusCode,
		).toBe(200);
	});
	it('blocks API data when a module is excluded, even if its feature is included', async () => {
		const plan = await plans.savePlan(
			undefined,
			{
				name: 'Restricted',
				description: '',
				status: 'PUBLISHED',
				priceCents: null,
				flags: { ...defaultPlanFlags, catalog: false },
			},
			audit,
		);
		await plans.setTenantPlan(
			tenantId,
			{ planId: plan.id, overrides: {} },
			audit,
		);
		const result = await app.inject({
			method: 'GET',
			url: '/products',
			headers: adminHeaders,
		});
		expect(result.statusCode).toBe(403);
		expect(result.body).toContain('MODULE_DISABLED');
	});
	it('resolves overrides before plan, while global feature/module kill switches dominate', async () => {
		await plans.setTenantPlan(
			tenantId,
			{
				planId: DEFAULT_PLAN_ID,
				overrides: { catalog: false, 'catalog.products': true },
			},
			audit,
		);
		const service = new PlanAccessService(plans);
		expect(
			(await service.resolve(tenantId)).features.find(
				(f) => f.key === 'catalog.products',
			)?.enabled,
		).toBe(false);
		await plans.setTenantPlan(
			tenantId,
			{
				planId: DEFAULT_PLAN_ID,
				overrides: { catalog: true, 'catalog.products': true },
			},
			audit,
		);
		await plans.setControls(
			{ disabledKeys: ['catalog.products'], maintenance: false },
			audit,
		);
		expect(
			(await service.resolve(tenantId)).features.find(
				(f) => f.key === 'catalog.products',
			)?.reason,
		).toBe('GLOBAL_KILL_SWITCH');
		await plans.setControls(
			{ disabledKeys: ['catalog'], maintenance: false },
			audit,
		);
		expect(
			(await service.resolve(tenantId)).features
				.filter((f) => f.module === 'catalog')
				.every((f) => !f.enabled),
		).toBe(true);
	});
	it('blocks reads and writes immediately, including root operational access, and allows recovery', async () => {
		await plans.setControls(
			{ disabledKeys: ['catalog'], maintenance: false },
			audit,
		);
		expect(
			(
				await app.inject({
					method: 'GET',
					url: '/products',
					headers: adminHeaders,
				})
			).statusCode,
		).toBe(403);
		expect(
			(
				await app.inject({
					method: 'POST',
					url: '/products',
					headers: adminHeaders,
					payload: { name: 'Blocked Product' },
				})
			).statusCode,
		).toBe(403);
		expect(
			(
				await app.inject({
					method: 'GET',
					url: '/products',
					headers: rootHeaders,
				})
			).statusCode,
		).toBe(403);
		expect(
			(
				await app.inject({
					method: 'GET',
					url: '/admin/controls',
					headers: rootHeaders,
				})
			).statusCode,
		).toBe(200);
		await plans.setControls({ disabledKeys: [], maintenance: false }, audit);
		expect(
			(
				await app.inject({
					method: 'GET',
					url: '/products',
					headers: adminHeaders,
				})
			).statusCode,
		).toBe(200);
	});
	it('maintenance keeps auth and administration available', async () => {
		await plans.setControls({ disabledKeys: [], maintenance: true }, audit);
		expect(
			(
				await app.inject({
					method: 'GET',
					url: '/dashboard/overview',
					headers: adminHeaders,
				})
			).statusCode,
		).toBe(403);
		expect(
			(
				await app.inject({
					method: 'GET',
					url: '/auth/me',
					headers: rootHeaders,
				})
			).statusCode,
		).toBe(200);
		expect(
			(
				await app.inject({
					method: 'GET',
					url: '/admin/plans',
					headers: rootHeaders,
				})
			).statusCode,
		).toBe(200);
	});

	it('paginates plans with server-side filtering and bounded parameters', async () => {
		for (let i = 0; i < 3; i++)
			await plans.savePlan(
				undefined,
				{
					name: `Paging ${i}`,
					description: 'Filterable',
					status: 'PUBLISHED',
					priceCents: null,
					flags: {},
				},
				{
					actorId: 'test',
					action: 'PLAN_CREATED',
					targetId: 'test',
					reason: 'testing pagination',
					changes: {},
				},
			);
		const first = await app.inject({
			method: 'GET',
			url: '/admin/plans?filter=Paging&perPage=2',
			headers: rootHeaders,
		});
		const second = await app.inject({
			method: 'GET',
			url: '/admin/plans?filter=Paging&perPage=2&page=2',
			headers: rootHeaders,
		});
		expect(first.statusCode).toBe(200);
		expect(first.json()).toMatchObject({
			total: 3,
			page: 1,
			perPage: 2,
			totalPages: 2,
		});
		expect(first.json().items).toHaveLength(2);
		expect(second.json().items).toHaveLength(1);
		expect(
			first.json().items.map((row: { id: string }) => row.id),
		).not.toContain(second.json().items[0].id);
		expect(
			(
				await app.inject({
					method: 'GET',
					url: '/admin/plans?perPage=101',
					headers: rootHeaders,
				})
			).statusCode,
		).toBe(400);
		expect(
			(
				await app.inject({
					method: 'GET',
					url: '/admin/plans?filter=missing',
					headers: rootHeaders,
				})
			).json(),
		).toMatchObject({ items: [], total: 0, totalPages: 0 });
	});
	it('validates keys, reason and published plan assignment', async () => {
		const request = {
			method: 'POST' as const,
			url: '/admin/plans',
			headers: rootHeaders,
			payload: {
				name: 'Test Plan',
				status: 'PUBLISHED',
				flags: { unknown: true },
				reason: 'valid reason',
			},
		};
		expect((await app.inject(request)).statusCode).toBe(400);
		const draft = await plans.savePlan(
			undefined,
			{
				name: 'Draft',
				description: '',
				status: 'DRAFT',
				priceCents: null,
				flags: {},
			},
			audit,
		);
		expect(
			(
				await app.inject({
					method: 'PATCH',
					url: `/admin/tenants/${tenantId}/plan`,
					headers: rootHeaders,
					payload: { planId: draft.id, overrides: {}, reason: 'valid reason' },
				})
			).statusCode,
		).toBe(403);
		expect(
			(
				await app.inject({
					method: 'PATCH',
					url: '/admin/controls',
					headers: rootHeaders,
					payload: { disabledKeys: [], maintenance: true, reason: '' },
				})
			).statusCode,
		).toBe(400);
	});
	it('audits changes and cannot archive default or assigned plans', async () => {
		const plan = await plans.savePlan(
			undefined,
			{
				name: 'Custom',
				description: '',
				status: 'PUBLISHED',
				priceCents: 1000,
				flags: { ...defaultPlanFlags },
			},
			audit,
		);
		const assigned = await app.inject({
			method: 'PATCH',
			url: `/admin/tenants/${tenantId}/plan`,
			headers: rootHeaders,
			payload: {
				planId: plan.id,
				overrides: { 'catalog.images': false },
				reason: 'custom contract',
			},
		});
		expect(assigned.statusCode).toBe(200);
		expect(
			(
				await app.inject({
					method: 'PATCH',
					url: `/admin/plans/${plan.id}`,
					headers: rootHeaders,
					payload: {
						name: 'Custom',
						status: 'ARCHIVED',
						flags: {},
						reason: 'archive test',
					},
				})
			).statusCode,
		).toBe(403);
		expect(
			(await plans.listAudit()).some(
				(record) => record.action === 'TENANT_PLAN_UPDATED',
			),
		).toBe(true);
	});
	it('maps granular operational routes and leaves control plane outside gates', () => {
		expect(operationalFeature('/products/:productId/assets/upload')).toBe(
			'catalog.images',
		);
		expect(operationalFeature('/inventory/adjustments')).toBe(
			'inventory.adjustments',
		);
		expect(
			operationalFeature('/dashboard/customers/:customerId/promissory'),
		).toBe('finance.receivables');
		expect(operationalFeature('/admin/plans')).toBeUndefined();
	});
});
