import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	AccountStatus,
	StoreSegment,
	StoreStatus,
	TenantStatus,
	type User,
	UserRole,
} from '../../../src/core/domain';
import type { StoreRepository } from '../../../src/core/domain/repositories/store-repository';
import type { UserRepository } from '../../../src/core/domain/repositories/user-repository';
import { JWTService } from '../../../src/core/infra/auth/jwt-service';
import {
	InMemoryStoreRepository,
	InMemoryUserRepository,
	PrismaStoreRepository,
	PrismaUserRepository,
	prisma,
} from '../../../src/core/infra/persistence';
import { env } from '../../../src/shared/env';
import { createTestServer, makeRequest } from '../helpers';

const modes =
	process.env.RUN_PRISMA_INTEGRATION_TESTS === 'true'
		? ['memory', 'postgres']
		: ['memory'];
describe.each(modes)('Empresas e filiais (%s)', (mode) => {
	let server: FastifyInstance;
	let stores: StoreRepository;
	let users: UserRepository;
	let createdIds: string[];
	let root: User;
	let admin: User;
	let otherAdmin: User;
	let employee: User;
	let tenantId: string;
	let otherTenantId: string;
	let firstStoreId: string;
	let secondStoreId: string;
	let otherStoreId: string;

	beforeEach(async () => {
		createdIds = [];
		users =
			mode === 'postgres'
				? new PrismaUserRepository(prisma)
				: new InMemoryUserRepository();
		stores =
			mode === 'postgres'
				? new PrismaStoreRepository(prisma)
				: new InMemoryStoreRepository();
		async function create(role: UserRole) {
			const user = await users.create({
				name: 'Tenant Test',
				email: `tenant-${crypto.randomUUID()}@test.local`,
				role,
				accountStatus: AccountStatus.ACTIVE,
				passwordHash: 'unused',
			});
			createdIds.push(user.id);
			return user;
		}
		root = await create(UserRole.SUPER_ADMIN);
		admin = await create(UserRole.ADMIN);
		otherAdmin = await create(UserRole.ADMIN);
		employee = await create(UserRole.EMPLOYEE);
		tenantId = (
			await stores.createTenant({
				name: 'Company A',
				ownerId: admin.id,
				slug: crypto.randomUUID(),
			})
		).id;
		otherTenantId = (
			await stores.createTenant({
				name: 'Company B',
				ownerId: otherAdmin.id,
				slug: crypto.randomUUID(),
			})
		).id;
		async function branch(companyId: string, ownerId: string) {
			const slug = crypto.randomUUID();
			return stores.create({
				tenantId: companyId,
				ownerId,
				name: 'Branch',
				slug,
				bucketKey: `stores/${slug}`,
				phone: '11999999999',
				document: crypto.randomUUID(),
				segment: StoreSegment.FASHION,
				status: StoreStatus.ACTIVE,
			});
		}
		firstStoreId = (await branch(tenantId, admin.id)).id;
		secondStoreId = (await branch(tenantId, admin.id)).id;
		otherStoreId = (await branch(otherTenantId, otherAdmin.id)).id;
		await stores.addMember(firstStoreId, employee.id, 'EMPLOYEE');
		server = await createTestServer(users, { storeRepository: stores });
	});
	afterEach(async () => {
		await server.close();
		for (const id of createdIds) await users.delete(id);
	});
	function call(
		user: User,
		method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
		url: string,
		body?: object,
		storeId?: string,
	) {
		const token = new JWTService(env.JWT_SECRET, env.JWT_EXPIRES_IN).generate({
			userId: user.id,
			email: user.email,
			role: user.role,
		});
		return makeRequest(server, {
			method,
			url,
			body,
			headers: {
				authorization: `Bearer ${token}`,
				...(storeId ? { 'x-store-id': storeId } : {}),
			},
		});
	}

	it('ADMIN administra todas as filiais de sua empresa, sem acesso a outra empresa', async () => {
		const list = await call(admin, 'GET', `/tenants/${tenantId}/stores`);
		expect(list.statusCode).toBe(200);
		expect(
			(list.body as { items: { id: string; tenantId: string }[] }).items
				.map((s) => s.id)
				.sort(),
		).toEqual([firstStoreId, secondStoreId].sort());
		expect(
			(await call(admin, 'GET', `/tenants/${otherTenantId}/stores`)).statusCode,
		).toBe(403);
		expect(
			(await call(admin, 'GET', '/suppliers', undefined, otherStoreId))
				.statusCode,
		).toBe(403);
	});
	it('funcionario permanece limitado a sua filial mesmo dentro da mesma empresa', async () => {
		expect(
			(await call(employee, 'GET', '/suppliers', undefined, firstStoreId))
				.statusCode,
		).toBe(200);
		expect(
			(await call(employee, 'GET', '/suppliers', undefined, secondStoreId))
				.statusCode,
		).toBe(403);
		expect(
			(
				(await call(employee, 'GET', `/tenants/${tenantId}/stores`)).body as {
					items: unknown[];
				}
			).items,
		).toHaveLength(1);
		expect(
			(
				await call(employee, 'POST', `/tenants/${tenantId}/stores`, {
					name: 'Forbidden branch',
				})
			).statusCode,
		).toBe(403);
	});

	it('MANAGER opera somente sua filial e nao administra empresas ou a plataforma', async () => {
		await users.update(employee.id, { role: UserRole.MANAGER });
		const manager = { ...employee, role: UserRole.MANAGER };
		await stores.updateMemberRoles(manager.id, 'MANAGER');
		expect(
			(await call(manager, 'GET', '/suppliers', undefined, firstStoreId))
				.statusCode,
		).toBe(200);
		expect(
			(await call(manager, 'GET', '/suppliers', undefined, secondStoreId))
				.statusCode,
		).toBe(403);
		expect((await call(manager, 'GET', '/admin/stores')).statusCode).toBe(403);
		expect(
			(
				await call(manager, 'POST', `/tenants/${tenantId}/stores`, {
					name: 'Denied',
				})
			).statusCode,
		).toBe(403);
	});
	it('cria uma nova filial no tenant autorizado sem exigir associacao individual do ADMIN', async () => {
		const response = await call(admin, 'POST', `/tenants/${tenantId}/stores`, {
			name: 'New branch',
			phone: '11999999999',
			document: crypto.randomUUID(),
			segment: 'fashion',
		});
		expect(response.statusCode).toBe(201);
		const branch = response.body as {
			id: string;
			tenantId: string;
			ownerId: string;
		};
		expect(branch).toMatchObject({ tenantId, ownerId: admin.id });
		expect(
			(await call(admin, 'GET', '/suppliers', undefined, branch.id)).statusCode,
		).toBe(200);
	});
	it('suspender a empresa bloqueia todas as filiais; reativacao restaura o acesso', async () => {
		expect(
			(
				await call(admin, 'PATCH', `/tenants/${tenantId}`, {
					status: 'SUSPENDED',
				})
			).statusCode,
		).toBe(403);
		expect(
			(
				await call(root, 'PATCH', `/tenants/${tenantId}`, {
					status: 'SUSPENDED',
				})
			).statusCode,
		).toBe(200);
		for (const storeId of [firstStoreId, secondStoreId])
			expect(
				(await call(admin, 'GET', '/suppliers', undefined, storeId)).statusCode,
			).toBe(403);
		expect(
			(await call(otherAdmin, 'GET', '/suppliers', undefined, otherStoreId))
				.statusCode,
		).toBe(200);
		expect(
			(await call(root, 'PATCH', `/tenants/${tenantId}`, { status: 'ACTIVE' }))
				.statusCode,
		).toBe(200);
		expect(
			(await call(admin, 'GET', '/suppliers', undefined, secondStoreId))
				.statusCode,
		).toBe(200);
	});

	it('pagina empresas e filiais no servidor e filtra antes de contar', async () => {
		const first = await call(root, 'GET', '/tenants?perPage=1&page=1');
		const second = await call(root, 'GET', '/tenants?perPage=1&page=2');
		const a = first.body as {
			items: { id: string; branchCount: number }[];
			total: number;
			totalPages: number;
		};
		const b = second.body as typeof a;
		expect(first.statusCode).toBe(200);
		expect(a.items).toHaveLength(1);
		expect(b.items).toHaveLength(1);
		expect(a.items[0].id).not.toBe(b.items[0].id);
		const filtered = await call(
			root,
			'GET',
			'/tenants?filter=Company%20A&perPage=1',
		);
		expect(filtered.body).toMatchObject({
			total: 1,
			totalPages: 1,
			items: [{ id: tenantId, branchCount: 2 }],
		});
		const branches = await call(
			admin,
			'GET',
			`/tenants/${tenantId}/stores?page=2&perPage=1`,
		);
		expect(branches.body).toMatchObject({
			page: 2,
			perPage: 1,
			total: 2,
			totalPages: 2,
		});
		expect((branches.body as { items: unknown[] }).items).toHaveLength(1);
		const scoped = await call(
			employee,
			'GET',
			`/tenants/${tenantId}/stores?perPage=1`,
		);
		expect(scoped.body).toMatchObject({
			total: 1,
			items: [{ id: firstStoreId }],
		});
		expect((await call(root, 'GET', '/tenants?page=0')).statusCode).toBe(400);
		expect((await call(root, 'GET', '/tenants?perPage=101')).statusCode).toBe(
			400,
		);
	});
	it('SUPER_ADMIN acessa empresas globalmente e proprietarios nao sao excluidos por cascata via API', async () => {
		expect(
			((await call(root, 'GET', '/tenants')).body as { items: unknown[] })
				.items,
		).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: tenantId }),
				expect.objectContaining({ id: otherTenantId }),
			]),
		);
		expect(
			(await call(root, 'GET', `/tenants/${otherTenantId}/stores`)).statusCode,
		).toBe(200);
		expect((await call(root, 'DELETE', `/users/${admin.id}`)).statusCode).toBe(
			403,
		);
	});
	it('permite gerenciar um funcionario de varias filiais da mesma empresa, preservando fronteiras entre empresas', async () => {
		await stores.addMember(secondStoreId, employee.id, 'EMPLOYEE');
		expect(
			(
				await call(
					admin,
					'PATCH',
					`/users/${employee.id}`,
					{ name: 'Updated employee' },
					firstStoreId,
				)
			).statusCode,
		).toBe(200);
		await stores.addMember(otherStoreId, employee.id, 'EMPLOYEE');
		expect(
			(
				await call(
					admin,
					'PATCH',
					`/users/${employee.id}`,
					{ name: 'Forbidden update' },
					firstStoreId,
				)
			).statusCode,
		).toBe(403);
	});
	it('mantem tenantId imutavel e impede proprietario de outra empresa na criacao', async () => {
		await expect(
			stores.update(firstStoreId, { tenantId: otherTenantId } as never),
		).rejects.toThrow();
		if (mode === 'postgres')
			await expect(
				prisma.store.update({
					where: { id: firstStoreId },
					data: { tenantId: otherTenantId },
				}),
			).rejects.toThrow('Store tenant_id is immutable');
		await expect(
			stores.create({
				tenantId,
				ownerId: otherAdmin.id,
				name: 'Wrong company',
				slug: crypto.randomUUID(),
				bucketKey: 'stores/wrong',
				phone: '11999999999',
				document: crypto.randomUUID(),
				segment: StoreSegment.FASHION,
				status: StoreStatus.ACTIVE,
			}),
		).rejects.toThrow();
		expect((await stores.findTenantById(tenantId))?.status).toBe(
			TenantStatus.ACTIVE,
		);
	});
});
