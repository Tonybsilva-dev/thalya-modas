import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AccountStatus, UserRole } from '../../../src/core/domain/index.ts';
import { BcryptPasswordHasher } from '../../../src/core/infra/auth/password-hasher';
import { UserFactory } from '../../factories';
import { MockUserRepository } from '../../unit/core/domain/repositories/mock-user-repository';
import { createTestServer, makeRequest } from '../helpers';

describe('POST /auth/register - Integração', () => {
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
		it('deve registrar um novo usuário com sucesso', async () => {
			const registerData = UserFactory.createRegisterData({
				name: 'Jane Doe',
				email: 'jane.doe@example.com',
				password: 'securePassword123',
			});

			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/register',
				body: registerData,
			});

			expect(response.statusCode).toBe(201);
			expect(response.body).toHaveProperty('user');
			expect(response.body).toHaveProperty('token');
			expect((response.body as { user: unknown }).user).toMatchObject({
				name: 'Jane Doe',
				email: 'jane.doe@example.com',
				role: UserRole.CUSTOMER,
				accountStatus: AccountStatus.ACTIVE,
			});
			expect((response.body as { user: { id: string } }).user.id).toBeDefined();
			expect((response.body as { token: string }).token).toBeTypeOf('string');
			expect((response.body as { token: string }).token.length).toBeGreaterThan(
				0,
			);
		});

		it('deve definir role CUSTOMER e status ACTIVE por padrão', async () => {
			const registerData = UserFactory.createRegisterData({
				name: 'Default User',
				email: 'default@example.com',
				password: 'password123',
			});

			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/register',
				body: registerData,
			});

			expect(response.statusCode).toBe(201);
			const user = (response.body as { user: unknown }).user as {
				role: string;
				accountStatus: string;
			};
			expect(user.role).toBe(UserRole.CUSTOMER);
			expect(user.accountStatus).toBe(AccountStatus.ACTIVE);
		});

		it('deve permitir registrar com accountStatus customizado', async () => {
			const registerData = UserFactory.createRegisterData({
				name: 'Custom User',
				email: 'custom@example.com',
				password: 'password123',
				accountStatus: AccountStatus.PENDING_VERIFICATION,
			});

			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/register',
				body: registerData,
			});

			expect(response.statusCode).toBe(201);
			const user = (response.body as { user: unknown }).user as {
				role: string;
				accountStatus: string;
			};
			expect(user.role).toBe(UserRole.CUSTOMER);
			expect(user.accountStatus).toBe(AccountStatus.PENDING_VERIFICATION);
		});
	});

	describe('Autorização por role', () => {
		it('deve retornar 403 ao solicitar role COMPANY sem token', async () => {
			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/register',
				body: {
					name: 'Company Name',
					email: 'company@example.com',
					password: 'securePassword123',
					role: UserRole.COMPANY,
				},
			});

			expect(response.statusCode).toBe(403);
			expect((response.body as { error: string }).error).toBe('ForbiddenError');
		});

		it('deve retornar 403 ao solicitar role EMPLOYEE sem token', async () => {
			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/register',
				body: {
					name: 'Employee Name',
					email: 'employee@example.com',
					password: 'securePassword123',
					role: UserRole.EMPLOYEE,
				},
			});

			expect(response.statusCode).toBe(403);
		});

		it('deve permitir SUPER_ADMIN cadastrar COMPANY com token', async () => {
			const plainPassword = 'superAdminPass123';
			const passwordHash = await passwordHasher.hash(plainPassword);
			const superAdmin = UserFactory.createAdmin({
				email: 'superadmin@example.com',
				passwordHash,
				accountStatus: AccountStatus.ACTIVE,
			});
			await userRepository.create(superAdmin);

			const loginResponse = await makeRequest(server, {
				method: 'POST',
				url: '/auth/login',
				body: {
					email: superAdmin.email,
					password: plainPassword,
				},
			});
			expect(loginResponse.statusCode).toBe(200);
			const token = (loginResponse.body as { token: string }).token;

			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/register',
				headers: { authorization: `Bearer ${token}` },
				body: {
					name: 'Company Name',
					email: 'company@example.com',
					password: 'securePassword123',
					role: UserRole.COMPANY,
				},
			});

			expect(response.statusCode).toBe(201);
			const user = (response.body as { user: { role: string } }).user;
			expect(user.role).toBe(UserRole.COMPANY);
		});

		it('deve permitir COMPANY cadastrar EMPLOYEE com token', async () => {
			const plainPassword = 'companyPass123';
			const passwordHash = await passwordHasher.hash(plainPassword);
			const company = UserFactory.create({
				email: 'company@example.com',
				role: UserRole.COMPANY,
				passwordHash,
				accountStatus: AccountStatus.ACTIVE,
			});
			await userRepository.create(company);

			const loginResponse = await makeRequest(server, {
				method: 'POST',
				url: '/auth/login',
				body: {
					email: company.email,
					password: plainPassword,
				},
			});
			expect(loginResponse.statusCode).toBe(200);
			const token = (loginResponse.body as { token: string }).token;

			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/register',
				headers: { authorization: `Bearer ${token}` },
				body: {
					name: 'Employee Name',
					email: 'employee@example.com',
					password: 'securePassword123',
					role: UserRole.EMPLOYEE,
				},
			});

			expect(response.statusCode).toBe(201);
			const user = (response.body as { user: { role: string } }).user;
			expect(user.role).toBe(UserRole.EMPLOYEE);
		});
	});

	describe('Validação de Input', () => {
		it('deve retornar 400 para email inválido', async () => {
			const registerData = UserFactory.createRegisterData({
				email: 'invalid-email',
				password: 'password123',
			});

			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/register',
				body: registerData,
			});

			expect(response.statusCode).toBe(400);
			expect(response.body).toHaveProperty('error');
		});

		it('deve retornar 400 para senha muito curta', async () => {
			const registerData = UserFactory.createRegisterData({
				email: 'user@example.com',
				password: 'short',
			});

			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/register',
				body: registerData,
			});

			expect(response.statusCode).toBe(400);
			expect(response.body).toHaveProperty('error');
		});

		it('deve retornar 400 para nome muito curto', async () => {
			const registerData = UserFactory.createRegisterData({
				name: 'A',
				email: 'user@example.com',
				password: 'password123',
			});

			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/register',
				body: registerData,
			});

			expect(response.statusCode).toBe(400);
			expect(response.body).toHaveProperty('error');
		});

		it('deve retornar 400 para body vazio', async () => {
			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/register',
				body: {},
			});

			expect(response.statusCode).toBe(400);
			expect(response.body).toHaveProperty('error');
		});
	});

	describe('Normalização de nome', () => {
		it('deve normalizar nome removendo caracteres especiais e emojis', async () => {
			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/register',
				body: {
					name: '  João   @Silva#  ',
					email: 'joao.silva@example.com',
					password: 'securePassword123',
				},
			});

			expect(response.statusCode).toBe(201);
			expect((response.body as { user: { name: string } }).user.name).toBe(
				'João Silva',
			);
		});
	});

	describe('Edge Cases', () => {
		it('deve retornar 400 para email duplicado', async () => {
			const email = 'duplicate@example.com';
			const existingUser = UserFactory.create({ email });
			await userRepository.create(existingUser);

			const registerData = UserFactory.createRegisterData({
				email,
				password: 'password123',
			});

			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/register',
				body: registerData,
			});

			expect(response.statusCode).toBe(400);
			expect(response.body).toHaveProperty('error');
		});

		it('deve hash a senha antes de armazenar', async () => {
			const registerData = UserFactory.createRegisterData({
				email: 'hashed@example.com',
				password: 'plainPassword123',
			});

			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/register',
				body: registerData,
			});

			expect(response.statusCode).toBe(201);
			const user = (response.body as { user: { id: string } }).user;
			const storedUser = await userRepository.findById(user.id);

			expect(storedUser).not.toBeNull();
			expect(storedUser?.passwordHash).not.toBe('plainPassword123');
			// Bcrypt pode gerar hashes com prefixo $2a$ ou $2b$ dependendo da versão
			expect(storedUser?.passwordHash).toMatch(/^\$2[ab]\$/);
		});
	});
});
