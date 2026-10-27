import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AccountStatus, type User, UserRole } from '../../../src/core/domain';
import type { StoreRepository } from '../../../src/core/domain/repositories/store-repository';
import type { UserRepository } from '../../../src/core/domain/repositories/user-repository';
import { JWTService } from '../../../src/core/infra/auth/jwt-service';
import { Argon2PasswordHasher } from '../../../src/core/infra/auth/password-hasher';
import {
	InMemoryStoreRepository,
	InMemoryUserRepository,
	PrismaStoreRepository,
	PrismaUserRepository,
	prisma,
} from '../../../src/core/infra/persistence';
import { env } from '../../../src/shared/env';
import {
	createActiveTestStore,
	createTestServer,
	makeRequest,
} from '../helpers';

const modes =
	process.env.RUN_PRISMA_INTEGRATION_TESTS === 'true'
		? ['memory', 'postgres']
		: ['memory'];
describe.each(modes)('Hierarquia e isolamento administrativo (%s)', (mode) => {
	let server: FastifyInstance;
	let users: UserRepository;
	let createdIds: string[];
	let stores: StoreRepository;
	let root: User;
	let admin: User;
	let employee: User;
	let customer: User;
	let outsider: User;
	let storeId: string;
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
				name: 'Test User',
				email: `${crypto.randomUUID()}@test.local`,
				role,
				passwordHash: 'unused',
				accountStatus: AccountStatus.ACTIVE,
			});
			createdIds.push(user.id);
			return user;
		}
		root = await create(UserRole.SUPER_ADMIN);
		admin = await create(UserRole.ADMIN);
		employee = await create(UserRole.EMPLOYEE);
		customer = await create(UserRole.CUSTOMER);
		outsider = await create(UserRole.ADMIN);
		storeId = (await createActiveTestStore(stores, admin.id)).id;
		otherStoreId = (await createActiveTestStore(stores, outsider.id)).id;
		await stores.addMember(storeId, employee.id, 'EMPLOYEE');
		await stores.addMember(storeId, customer.id, 'CUSTOMER');
		server = await createTestServer(users, { storeRepository: stores });
	});
	afterEach(async () => {
		await server.close();
		for (const id of createdIds) await users.delete(id);
	});

	function token(user: User) {
		return new JWTService(env.JWT_SECRET, env.JWT_EXPIRES_IN).generate({
			userId: user.id,
			email: user.email,
			role: user.role,
		});
	}
	function call(
		user: User,
		method: 'GET' | 'PATCH' | 'DELETE' | 'POST',
		url: string,
		body?: object,
		selected = storeId,
	) {
		return makeRequest(server, {
			method,
			url,
			body,
			headers: {
				authorization: `Bearer ${token(user)}`,
				'x-store-id': selected,
			},
		});
	}

	it('limita listagem e contagem do ADMIN à loja selecionada', async () => {
		const list = await call(admin, 'GET', '/users?perPage=1');
		expect(list.statusCode).toBe(200);
		expect(list.body).toMatchObject({ total: 3, perPage: 1 });
		expect((await call(admin, 'GET', '/users/count')).body).toEqual({
			count: 3,
		});
		expect(
			(await call(admin, 'GET', '/users', undefined, otherStoreId)).statusCode,
		).toBe(403);
		expect((await call(admin, 'GET', `/users/${outsider.id}`)).statusCode).toBe(
			403,
		);
	});
	it('impede promoção própria e de membros a ADMIN ou SUPER_ADMIN', async () => {
		for (const id of [admin.id, employee.id, customer.id]) {
			for (const role of [UserRole.ADMIN, UserRole.SUPER_ADMIN]) {
				expect(
					(await call(admin, 'PATCH', `/users/${id}`, { role })).statusCode,
				).toBe(403);
			}
		}
	});
	it('permite gerenciar subordinados locais e bloqueia alterações fora da loja', async () => {
		expect(
			(
				await call(admin, 'PATCH', `/users/${employee.id}`, {
					accountStatus: AccountStatus.SUSPENDED,
				})
			).statusCode,
		).toBe(200);
		expect(
			(await call(admin, 'PATCH', `/users/${outsider.id}`, { name: 'Other' }))
				.statusCode,
		).toBe(403);
		expect(
			(await call(admin, 'DELETE', `/users/${outsider.id}`)).statusCode,
		).toBe(403);
		expect(
			(
				await call(admin, 'PATCH', `/users/${root.id}`, {
					role: UserRole.CUSTOMER,
				})
			).statusCode,
		).toBe(403);
	});
	it('impede ADMIN de alterar ou excluir uma conta compartilhada entre lojas', async () => {
		await stores.addMember(otherStoreId, employee.id, 'EMPLOYEE');
		expect(
			(await call(admin, 'PATCH', `/users/${employee.id}`, { name: 'Changed' }))
				.statusCode,
		).toBe(403);
		expect(
			(await call(admin, 'DELETE', `/users/${employee.id}`)).statusCode,
		).toBe(403);
	});
	it('separa acesso operacional, perfil próprio e administração de usuários', async () => {
		expect((await call(employee, 'GET', '/suppliers')).statusCode).toBe(200);
		expect((await call(employee, 'GET', '/users')).statusCode).toBe(403);
		expect(
			(
				await call(employee, 'PATCH', `/users/${employee.id}`, {
					role: UserRole.ADMIN,
				})
			).statusCode,
		).toBe(403);
		expect((await call(customer, 'GET', '/suppliers')).statusCode).toBe(403);
		expect(
			(await call(customer, 'GET', '/dashboard/overview')).statusCode,
		).toBe(403);
		expect(
			(await call(customer, 'GET', `/users/${customer.id}`)).statusCode,
		).toBe(200);
		expect((await call(employee, 'GET', '/onboarding/me')).statusCode).toBe(
			403,
		);
	});
	it('permite ao SUPER_ADMIN listar lojas e selecionar tenants sem associação', async () => {
		expect(
			((await call(root, 'GET', '/admin/stores')).body as { items: unknown[] })
				.items,
		).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: storeId }),
				expect.objectContaining({ id: otherStoreId }),
			]),
		);
		expect((await call(admin, 'GET', '/admin/stores')).statusCode).toBe(403);
		expect(
			(await call(root, 'GET', '/suppliers', undefined, otherStoreId))
				.statusCode,
		).toBe(200);
		expect(
			((await call(root, 'GET', '/users')).body as { total: number }).total,
		).toBeGreaterThanOrEqual(5);
	});
	it('revoga sessoes ao alternar CUSTOMER e EMPLOYEE, mantendo o vinculo', async () => {
		await users.update(customer.id, {
			passwordHash: await new Argon2PasswordHasher().hash('Secure123'),
		});
		const signIn = async () => {
			const result = await makeRequest(server, {
				method: 'POST',
				url: '/auth/login',
				body: { email: customer.email, password: 'Secure123' },
			});
			expect(result.statusCode).toBe(200);
			return (result.body as { token: string }).token;
		};
		const original = await signIn();
		expect(
			(
				await call(admin, 'PATCH', `/users/${customer.id}`, {
					role: UserRole.EMPLOYEE,
				})
			).statusCode,
		).toBe(200);
		expect(
			(
				await makeRequest(server, {
					method: 'GET',
					url: '/suppliers',
					headers: {
						authorization: `Bearer ${original}`,
						'x-store-id': storeId,
					},
				})
			).statusCode,
		).toBe(401);
		const employeeSession = await signIn();
		expect(
			(
				await makeRequest(server, {
					method: 'GET',
					url: '/suppliers',
					headers: {
						authorization: `Bearer ${employeeSession}`,
						'x-store-id': storeId,
					},
				})
			).statusCode,
		).toBe(200);
		expect(
			(
				await call(admin, 'PATCH', `/users/${customer.id}`, {
					role: UserRole.CUSTOMER,
				})
			).statusCode,
		).toBe(200);
		expect(
			(
				await makeRequest(server, {
					method: 'GET',
					url: '/suppliers',
					headers: {
						authorization: `Bearer ${employeeSession}`,
						'x-store-id': storeId,
					},
				})
			).statusCode,
		).toBe(401);
		const customerSession = await signIn();
		expect(
			(
				await makeRequest(server, {
					method: 'GET',
					url: '/suppliers',
					headers: {
						authorization: `Bearer ${customerSession}`,
						'x-store-id': storeId,
					},
				})
			).statusCode,
		).toBe(403);
		expect(await stores.findAssociatedStoreIds(customer.id)).toContain(storeId);
	});

	it('revalida papel e status mesmo com token emitido anteriormente', async () => {
		const oldToken = token(admin);
		await users.update(admin.id, { role: UserRole.CUSTOMER });
		expect(
			(
				await makeRequest(server, {
					method: 'GET',
					url: '/users',
					headers: { authorization: `Bearer ${oldToken}` },
				})
			).statusCode,
		).toBe(403);
		await users.update(admin.id, { accountStatus: AccountStatus.SUSPENDED });
		expect(
			(
				await makeRequest(server, {
					method: 'GET',
					url: '/auth/me',
					headers: { authorization: `Bearer ${oldToken}` },
				})
			).statusCode,
		).toBe(401);
	});
	it('permite cadastro publico com cookies de preferencias sem sessao', async () => {
		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/register',
			headers: { cookie: 'locale=pt-BR' },
			body: {
				name: 'Public Admin',
				email: `public-${crypto.randomUUID()}@test.local`,
				password: 'Secure123456',
			},
		});
		expect(response.statusCode).toBe(201);
		const user = (response.body as { user: { id: string; role: string } }).user;
		createdIds.push(user.id);
		expect(user.role).toBe(UserRole.ADMIN);
	});

	it('vincula cadastro de EMPLOYEE à loja e rejeita token inválido', async () => {
		const created = await call(admin, 'POST', '/auth/register', {
			name: 'New Employee',
			email: `new-${crypto.randomUUID()}@test.local`,
			password: 'Secure123456',
			role: UserRole.EMPLOYEE,
		});
		expect(created.statusCode).toBe(201);
		const id = (created.body as { user: { id: string } }).user.id;
		createdIds.push(id);
		expect(await stores.findAssociatedStoreIds(id)).toEqual([storeId]);
		expect(
			(
				await makeRequest(server, {
					method: 'POST',
					url: '/auth/register',
					headers: { authorization: 'Bearer invalid' },
					body: {
						name: 'Invalid User',
						email: 'invalid@test.local',
						password: 'Secure123456',
					},
				})
			).statusCode,
		).toBe(401);
	});
});
