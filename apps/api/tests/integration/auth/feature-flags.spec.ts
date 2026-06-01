import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AccountStatus } from '../../../src/core/domain';
import { Argon2PasswordHasher } from '../../../src/core/infra/auth/password-hasher';
import { UserFactory } from '../../factories';
import { MockUserRepository } from '../../unit/core/domain/repositories/mock-user-repository';
import { createTestServer, makeRequest } from '../helpers';

describe('Auth feature flags - Integração', () => {
	let server: FastifyInstance;
	let userRepository: MockUserRepository;
	let passwordHasher: Argon2PasswordHasher;

	afterEach(async () => {
		await server.close();
		userRepository.clear();
	});

	describe('FEATURE_AUTH_LOGIN_ENABLED=false', () => {
		beforeEach(async () => {
			userRepository = new MockUserRepository();
			passwordHasher = new Argon2PasswordHasher();
			server = await createTestServer(userRepository, {
				featureFlags: { 'auth.login': false },
			});
		});

		it('deve retornar 403 e não gerar token', async () => {
			const passwordHash = await passwordHasher.hash('securePassword123');
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
					password: 'securePassword123',
				},
			});

			expect(response.statusCode).toBe(403);
			expect((response.body as { error: string }).error).toBe(
				'FeatureDisabledError',
			);
			expect(response.body).not.toHaveProperty('token');
			expect(
				(response.body as { details: { feature: string } }).details,
			).toEqual({
				feature: 'auth.login',
			});
		});
	});

	describe('FEATURE_AUTH_REGISTER_ENABLED=false', () => {
		beforeEach(async () => {
			userRepository = new MockUserRepository();
			passwordHasher = new Argon2PasswordHasher();
			server = await createTestServer(userRepository, {
				featureFlags: { 'auth.register': false },
			});
		});

		it('deve retornar 403 e não criar usuário', async () => {
			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/register',
				body: {
					name: 'Jane Doe',
					email: 'jane.doe@example.com',
					password: 'securePassword123',
				},
			});

			expect(response.statusCode).toBe(403);
			expect((response.body as { error: string }).error).toBe(
				'FeatureDisabledError',
			);
			expect(response.body).not.toHaveProperty('token');
			expect(
				(response.body as { details: { feature: string } }).details,
			).toEqual({
				feature: 'auth.register',
			});
			expect(
				await userRepository.findByEmail('jane.doe@example.com'),
			).toBeNull();
		});
	});
});
