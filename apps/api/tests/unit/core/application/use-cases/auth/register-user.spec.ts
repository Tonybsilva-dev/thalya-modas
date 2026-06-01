import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../../../../src/app/http/errors/domain-error';
import { ForbiddenError } from '../../../../../../src/app/http/errors/forbidden-error';
import { RegisterUserUseCase } from '../../../../../../src/core/application/use-cases/auth/register-user';
import { AccountStatus, UserRole } from '../../../../../../src/core/domain';
import { JWTService } from '../../../../../../src/core/infra/auth/jwt-service';
import { Argon2PasswordHasher } from '../../../../../../src/core/infra/auth/password-hasher';
import { MockUserRepository } from '../../../domain/repositories/mock-user-repository';

describe('RegisterUserUseCase', () => {
	const jwtSecret = 'test-secret-key-that-is-at-least-32-characters-long';
	const jwtService = new JWTService(jwtSecret);
	const passwordHasher = new Argon2PasswordHasher();

	it('deve registrar um novo usuário com sucesso', async () => {
		const repository = new MockUserRepository();
		const useCase = new RegisterUserUseCase(
			repository,
			passwordHasher,
			jwtService,
		);

		const input = {
			name: 'John Doe',
			email: 'john@example.com',
			password: 'securePassword123',
		};

		const result = await useCase.execute(input);

		expect(result.user).toBeDefined();
		expect(result.user.id).toBeDefined();
		expect(result.user.name).toBe(input.name);
		expect(result.user.email).toBe(input.email);
		expect(result.user.role).toBe(UserRole.COMPANY); // Padrão público
		expect(result.user.accountStatus).toBe(AccountStatus.ACTIVE); // Padrão
		expect(result.token).toBeDefined();
		expect(typeof result.token).toBe('string');
	});

	it('deve usar role COMPANY como padrão do cadastro público quando não fornecido', async () => {
		const repository = new MockUserRepository();
		const useCase = new RegisterUserUseCase(
			repository,
			passwordHasher,
			jwtService,
		);

		const result = await useCase.execute({
			name: 'John Doe',
			email: 'john@example.com',
			password: 'securePassword123',
		});

		expect(result.user.role).toBe(UserRole.COMPANY);
	});

	it('deve normalizar email no cadastro', async () => {
		const repository = new MockUserRepository();
		const useCase = new RegisterUserUseCase(
			repository,
			passwordHasher,
			jwtService,
		);

		const result = await useCase.execute({
			name: 'John Doe',
			email: ' JOHN@EXAMPLE.COM ',
			password: 'securePassword123',
		});

		expect(result.user.email).toBe('john@example.com');
		expect(await repository.findByEmail('john@example.com')).not.toBeNull();
	});

	it('deve lançar ForbiddenError ao tentar cadastrar SUPER_ADMIN por esta rota', async () => {
		const repository = new MockUserRepository();
		const useCase = new RegisterUserUseCase(
			repository,
			passwordHasher,
			jwtService,
		);

		await expect(
			useCase.execute({
				name: 'Admin User',
				email: 'admin@example.com',
				password: 'securePassword123',
				role: UserRole.SUPER_ADMIN,
			}),
		).rejects.toThrow(ForbiddenError);
	});

	it('deve permitir SUPER_ADMIN cadastrar COMPANY', async () => {
		const repository = new MockUserRepository();
		const useCase = new RegisterUserUseCase(
			repository,
			passwordHasher,
			jwtService,
		);

		const result = await useCase.execute({
			name: 'Company Name',
			email: 'company@example.com',
			password: 'securePassword123',
			role: UserRole.COMPANY,
			actor: { id: 'super-admin-id', role: UserRole.SUPER_ADMIN },
		});

		expect(result.user.role).toBe(UserRole.COMPANY);
	});

	it('deve lançar ForbiddenError quando COMPANY é solicitado sem actor SUPER_ADMIN', async () => {
		const repository = new MockUserRepository();
		const useCase = new RegisterUserUseCase(
			repository,
			passwordHasher,
			jwtService,
		);

		await expect(
			useCase.execute({
				name: 'Company Name',
				email: 'company@example.com',
				password: 'securePassword123',
				role: UserRole.COMPANY,
			}),
		).rejects.toThrow(ForbiddenError);
	});

	it('deve permitir COMPANY cadastrar EMPLOYEE', async () => {
		const repository = new MockUserRepository();
		const useCase = new RegisterUserUseCase(
			repository,
			passwordHasher,
			jwtService,
		);

		const result = await useCase.execute({
			name: 'Employee Name',
			email: 'employee@example.com',
			password: 'securePassword123',
			role: UserRole.EMPLOYEE,
			actor: { id: 'company-id', role: UserRole.COMPANY },
		});

		expect(result.user.role).toBe(UserRole.EMPLOYEE);
	});

	it('deve permitir COMPANY cadastrar DELIVERY_MAN', async () => {
		const repository = new MockUserRepository();
		const useCase = new RegisterUserUseCase(
			repository,
			passwordHasher,
			jwtService,
		);

		const result = await useCase.execute({
			name: 'Delivery Name',
			email: 'delivery@example.com',
			password: 'securePassword123',
			role: UserRole.DELIVERY_MAN,
			actor: { id: 'company-id', role: UserRole.COMPANY },
		});

		expect(result.user.role).toBe(UserRole.DELIVERY_MAN);
	});

	it('deve lançar ForbiddenError quando EMPLOYEE é solicitado sem actor COMPANY', async () => {
		const repository = new MockUserRepository();
		const useCase = new RegisterUserUseCase(
			repository,
			passwordHasher,
			jwtService,
		);

		await expect(
			useCase.execute({
				name: 'Employee Name',
				email: 'employee@example.com',
				password: 'securePassword123',
				role: UserRole.EMPLOYEE,
			}),
		).rejects.toThrow(ForbiddenError);
	});

	it('deve usar ACTIVE como accountStatus padrão', async () => {
		const repository = new MockUserRepository();
		const useCase = new RegisterUserUseCase(
			repository,
			passwordHasher,
			jwtService,
		);

		const result = await useCase.execute({
			name: 'John Doe',
			email: 'john@example.com',
			password: 'securePassword123',
		});

		expect(result.user.accountStatus).toBe(AccountStatus.ACTIVE);
	});

	it('deve rejeitar accountStatus customizado no cadastro público', async () => {
		const repository = new MockUserRepository();
		const useCase = new RegisterUserUseCase(
			repository,
			passwordHasher,
			jwtService,
		);

		await expect(
			useCase.execute({
				name: 'John Doe',
				email: 'john@example.com',
				password: 'securePassword123',
				accountStatus: AccountStatus.PENDING_VERIFICATION,
			}),
		).rejects.toThrow(ForbiddenError);
	});

	it('deve aceitar accountStatus customizado em cadastro administrativo', async () => {
		const repository = new MockUserRepository();
		const useCase = new RegisterUserUseCase(
			repository,
			passwordHasher,
			jwtService,
		);

		const result = await useCase.execute({
			name: 'Employee Name',
			email: 'employee@example.com',
			password: 'securePassword123',
			role: UserRole.EMPLOYEE,
			accountStatus: AccountStatus.PENDING_VERIFICATION,
			actor: { id: 'company-id', role: UserRole.COMPANY },
		});

		expect(result.user.accountStatus).toBe(AccountStatus.PENDING_VERIFICATION);
	});

	it('deve lançar erro quando email já existe', async () => {
		const repository = new MockUserRepository();
		const useCase = new RegisterUserUseCase(
			repository,
			passwordHasher,
			jwtService,
		);

		await repository.create({
			name: 'Existing User',
			email: 'existing@example.com',
			passwordHash: 'hashed:password',
			role: UserRole.CUSTOMER,
			accountStatus: AccountStatus.ACTIVE,
		});

		await expect(
			useCase.execute({
				name: 'New User',
				email: 'existing@example.com',
				password: 'securePassword123',
			}),
		).rejects.toThrow(DomainError);
	});

	it('deve hash a senha antes de salvar', async () => {
		const repository = new MockUserRepository();
		const useCase = new RegisterUserUseCase(
			repository,
			passwordHasher,
			jwtService,
		);

		const input = {
			name: 'John Doe',
			email: 'john@example.com',
			password: 'securePassword123',
		};

		await useCase.execute(input);

		const user = await repository.findByEmail(input.email);
		expect(user).not.toBeNull();
		expect(user?.passwordHash).not.toBe(input.password);
		expect(user?.passwordHash).toMatch(/^\$argon2id\$/);
	});

	it('deve gerar token JWT válido', async () => {
		const repository = new MockUserRepository();
		const useCase = new RegisterUserUseCase(
			repository,
			passwordHasher,
			jwtService,
		);

		const result = await useCase.execute({
			name: 'John Doe',
			email: 'john@example.com',
			password: 'securePassword123',
		});

		const validation = jwtService.validate(result.token);
		expect(validation.valid).toBe(true);
		expect(validation.payload?.userId).toBe(result.user.id);
		expect(validation.payload?.email).toBe(result.user.email);
		expect(validation.payload?.role).toBe(result.user.role);
	});

	it('deve rejeitar senha muito curta', async () => {
		const repository = new MockUserRepository();
		const useCase = new RegisterUserUseCase(
			repository,
			passwordHasher,
			jwtService,
		);

		await expect(
			useCase.execute({
				name: 'John Doe',
				email: 'john@example.com',
				password: 'short',
			}),
		).rejects.toThrow();
	});

	it('deve rejeitar email inválido', async () => {
		const repository = new MockUserRepository();
		const useCase = new RegisterUserUseCase(
			repository,
			passwordHasher,
			jwtService,
		);

		await expect(
			useCase.execute({
				name: 'John Doe',
				email: 'invalid-email',
				password: 'securePassword123',
			}),
		).rejects.toThrow();
	});
});
