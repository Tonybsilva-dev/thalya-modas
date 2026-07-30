import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AccountStatus, type User, UserRole } from '../../../src/core/domain';
import { JWTService } from '../../../src/core/infra/auth/jwt-service';
import { InMemoryUserRepository } from '../../../src/core/infra/persistence';
import { env } from '../../../src/shared/env';
import { createTestServer, makeRequest } from '../helpers';

describe('Users - Integração', () => {
	let server: FastifyInstance;
	let repository: InMemoryUserRepository;
	let admin: User;
	let customer: User;
	let employee: User;

	beforeEach(async () => {
		repository = new InMemoryUserRepository();
		admin = await createUser(repository, {
			email: 'admin@thalya.test',
			name: 'Admin Thalya',
			role: UserRole.SUPER_ADMIN,
		});
		customer = await createUser(repository, {
			email: 'cliente@thalya.test',
			name: 'Cliente Thalya',
			role: UserRole.CUSTOMER,
		});
		employee = await createUser(repository, {
			email: 'colaborador@thalya.test',
			name: 'Colaborador Thalya',
			role: UserRole.EMPLOYEE,
		});
		server = await createTestServer(repository);
	});

	afterEach(async () => {
		await server.close();
	});

	it('verifica a disponibilidade de email sem expor outros dados', async () => {
		const existing = await makeRequest(server, {
			method: 'GET',
			url: '/users/check-email?email=cliente@thalya.test',
		});
		const available = await makeRequest(server, {
			method: 'GET',
			url: '/users/check-email?email=novo@thalya.test',
		});

		expect(existing.statusCode).toBe(200);
		expect(existing.body).toEqual({ available: false });
		expect(available.body).toEqual({ available: true });
	});

	it('lista e conta usuários com paginação e filtro para administrador', async () => {
		const token = tokenFor(admin);
		const list = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'GET',
			url: '/users?page=1&perPage=2&sort=desc',
		});
		const count = await makeRequest(server, {
			headers: { authorization: `Bearer ${token}` },
			method: 'GET',
			url: '/users/count?filter=cliente',
		});

		expect(list.statusCode).toBe(200);
		expect(list.body).toMatchObject({
			page: 1,
			perPage: 2,
			total: 3,
			totalPages: 2,
		});
		expect((list.body as { items: unknown[] }).items).toHaveLength(2);
		expect(count.body).toEqual({ count: 1 });
	});

	it('bloqueia listagem, contagem e acesso a outro perfil para usuário comum', async () => {
		const authorization = `Bearer ${tokenFor(customer)}`;

		for (const url of ['/users', '/users/count', `/users/${employee.id}`]) {
			const response = await makeRequest(server, {
				headers: { authorization },
				method: 'GET',
				url,
			});

			expect(response.statusCode).toBe(403);
		}
	});

	it('retorna o próprio perfil e permite que administrador consulte outro usuário', async () => {
		const ownProfile = await makeRequest(server, {
			headers: { authorization: `Bearer ${tokenFor(customer)}` },
			method: 'GET',
			url: `/users/${customer.id}`,
		});
		const managedProfile = await makeRequest(server, {
			headers: { authorization: `Bearer ${tokenFor(admin)}` },
			method: 'GET',
			url: `/users/${employee.id}`,
		});

		expect(ownProfile.statusCode).toBe(200);
		expect(ownProfile.body).toMatchObject({
			email: customer.email,
			id: customer.id,
		});
		expect(managedProfile.statusCode).toBe(200);
		expect(managedProfile.body).toMatchObject({ id: employee.id });
		expect(ownProfile.body).not.toHaveProperty('passwordHash');
	});

	it('atualiza apenas o nome no próprio perfil de usuário comum', async () => {
		const authorization = `Bearer ${tokenFor(customer)}`;
		const updated = await makeRequest(server, {
			body: { name: 'Cliente Atualizado' },
			headers: { authorization },
			method: 'PATCH',
			url: `/users/${customer.id}`,
		});
		const forbidden = await makeRequest(server, {
			body: { email: 'outro@thalya.test' },
			headers: { authorization },
			method: 'PATCH',
			url: `/users/${customer.id}`,
		});

		expect(updated.statusCode).toBe(200);
		expect(updated.body).toMatchObject({ name: 'Cliente Atualizado' });
		expect(forbidden.statusCode).toBe(403);
	});

	it('permite que administrador atualize os campos administrativos', async () => {
		const response = await makeRequest(server, {
			body: {
				accountStatus: AccountStatus.SUSPENDED,
				role: UserRole.COMPANY,
			},
			headers: { authorization: `Bearer ${tokenFor(admin)}` },
			method: 'PATCH',
			url: `/users/${employee.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.body).toMatchObject({
			accountStatus: AccountStatus.SUSPENDED,
			role: UserRole.COMPANY,
		});
	});

	it('aplica autorização e not-found ao excluir usuários', async () => {
		const forbidden = await makeRequest(server, {
			headers: { authorization: `Bearer ${tokenFor(customer)}` },
			method: 'DELETE',
			url: `/users/${employee.id}`,
		});
		const removed = await makeRequest(server, {
			headers: { authorization: `Bearer ${tokenFor(admin)}` },
			method: 'DELETE',
			url: `/users/${employee.id}`,
		});
		const missing = await makeRequest(server, {
			headers: { authorization: `Bearer ${tokenFor(admin)}` },
			method: 'DELETE',
			url: `/users/${employee.id}`,
		});

		expect(forbidden.statusCode).toBe(403);
		expect(removed.statusCode).toBe(204);
		expect(missing.statusCode).toBe(404);
	});

	it('retorna not-found ao consultar ou atualizar usuário inexistente', async () => {
		const id = crypto.randomUUID();
		const authorization = `Bearer ${tokenFor(admin)}`;
		const getResponse = await makeRequest(server, {
			headers: { authorization },
			method: 'GET',
			url: `/users/${id}`,
		});
		const patchResponse = await makeRequest(server, {
			body: { name: 'Inexistente' },
			headers: { authorization },
			method: 'PATCH',
			url: `/users/${id}`,
		});

		expect(getResponse.statusCode).toBe(404);
		expect(patchResponse.statusCode).toBe(404);
	});
});

async function createUser(
	repository: InMemoryUserRepository,
	input: Pick<User, 'email' | 'name' | 'role'>,
) {
	return repository.create({
		...input,
		accountStatus: AccountStatus.ACTIVE,
		passwordHash: 'not-used-by-user-route-tests',
	});
}

function tokenFor(user: User) {
	return new JWTService(env.JWT_SECRET, env.JWT_EXPIRES_IN).generate({
		email: user.email,
		role: user.role,
		userId: user.id,
	});
}
