import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AccountStatus } from '../../../src/core/domain/index.ts';
import { BcryptPasswordHasher } from '../../../src/core/infra/auth/password-hasher';
import { UserFactory } from '../../factories';
import { MockUserRepository } from '../../unit/core/domain/repositories/mock-user-repository';
import { createTestServer, makeRequest } from '../helpers';

describe('POST /auth/login - Integração', () => {
	let server: FastifyInstance;
	let userRepository: MockUserRepository;
	let passwordHasher: BcryptPasswordHasher;

	beforeEach(async () => {
		userRepository = new MockUserRepository();
		passwordHasher = new BcryptPasswordHasher();
		server = await createTestServer(userRepository);
	});

	afterEach(async () => {
		await server.close();
		userRepository.clear();
	});

	describe('Happy Path', () => {
		it('deve fazer login com credenciais válidas', async () => {
			const plainPassword = 'securePassword123';
			const passwordHash = await passwordHasher.hash(plainPassword);

			const user = UserFactory.create({
				email: 'user@example.com',
				passwordHash,
				accountStatus: AccountStatus.ACTIVE,
			});
			await userRepository.create(user);

			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/login',
				body: {
					email: 'user@example.com',
					password: plainPassword,
				},
			});

			expect(response.statusCode).toBe(200);
			expect(response.body).toHaveProperty('user');
			expect(response.body).toHaveProperty('token');
			expect((response.body as { user: unknown }).user).toMatchObject({
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
				accountStatus: user.accountStatus,
			});
			expect((response.body as { token: string }).token).toBeTypeOf('string');
			expect((response.body as { token: string }).token.length).toBeGreaterThan(
				0,
			);
		});
	});

	describe('Error Cases', () => {
		it('deve retornar 401 para email inexistente', async () => {
			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/login',
				body: {
					email: 'nonexistent@example.com',
					password: 'password123',
				},
			});

			expect(response.statusCode).toBe(401);
			expect(response.body).toHaveProperty('error');
			expect((response.body as { message: string }).message).toContain(
				'Credenciais inválidas',
			);
		});

		it('deve retornar 401 para senha incorreta', async () => {
			const plainPassword = 'correctPassword123';
			const passwordHash = await passwordHasher.hash(plainPassword);

			const user = UserFactory.create({
				email: 'user@example.com',
				passwordHash,
				accountStatus: AccountStatus.ACTIVE,
			});
			await userRepository.create(user);

			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/login',
				body: {
					email: 'user@example.com',
					password: 'wrongPassword',
				},
			});

			expect(response.statusCode).toBe(401);
			expect(response.body).toHaveProperty('error');
			expect((response.body as { message: string }).message).toContain(
				'Credenciais inválidas',
			);
		});

		it('deve retornar 400 para email inválido', async () => {
			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/login',
				body: {
					email: 'invalid-email',
					password: 'password123',
				},
			});

			expect(response.statusCode).toBe(400);
			expect(response.body).toHaveProperty('error');
		});

		it('deve retornar 400 para senha vazia', async () => {
			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/login',
				body: {
					email: 'user@example.com',
					password: '',
				},
			});

			expect(response.statusCode).toBe(400);
			expect(response.body).toHaveProperty('error');
		});
	});

	describe('Account Status Validation', () => {
		it('deve retornar erro para conta INACTIVE', async () => {
			const plainPassword = 'password123';
			const passwordHash = await passwordHasher.hash(plainPassword);

			const user = UserFactory.createInactive({
				email: 'inactive@example.com',
				passwordHash,
			});
			await userRepository.create(user);

			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/login',
				body: {
					email: 'inactive@example.com',
					password: plainPassword,
				},
			});

			expect(response.statusCode).toBe(400);
			expect(response.body).toHaveProperty('error');
			expect((response.body as { message: string }).message).toContain(
				'não pode autenticar',
			);
		});

		it('deve retornar erro para conta SUSPENDED', async () => {
			const plainPassword = 'password123';
			const passwordHash = await passwordHasher.hash(plainPassword);

			const user = UserFactory.createSuspended({
				email: 'suspended@example.com',
				passwordHash,
			});
			await userRepository.create(user);

			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/login',
				body: {
					email: 'suspended@example.com',
					password: plainPassword,
				},
			});

			expect(response.statusCode).toBe(400);
			expect(response.body).toHaveProperty('error');
			expect((response.body as { message: string }).message).toContain(
				'não pode autenticar',
			);
		});

		it('deve retornar erro para conta PENDING_VERIFICATION', async () => {
			const plainPassword = 'password123';
			const passwordHash = await passwordHasher.hash(plainPassword);

			const user = UserFactory.createPendingVerification({
				email: 'pending@example.com',
				passwordHash,
			});
			await userRepository.create(user);

			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/login',
				body: {
					email: 'pending@example.com',
					password: plainPassword,
				},
			});

			expect(response.statusCode).toBe(400);
			expect(response.body).toHaveProperty('error');
			expect((response.body as { message: string }).message).toContain(
				'não pode autenticar',
			);
		});

		it('deve permitir login para conta ACTIVE', async () => {
			const plainPassword = 'password123';
			const passwordHash = await passwordHasher.hash(plainPassword);

			const user = UserFactory.create({
				email: 'active@example.com',
				passwordHash,
				accountStatus: AccountStatus.ACTIVE,
			});
			await userRepository.create(user);

			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/login',
				body: {
					email: 'active@example.com',
					password: plainPassword,
				},
			});

			expect(response.statusCode).toBe(200);
			expect(response.body).toHaveProperty('token');
		});
	});
});
