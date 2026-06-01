import { describe, expect, it } from 'vitest';
import { AuthError } from '../../../../../../src/app/http/errors/auth-error';
import { DomainError } from '../../../../../../src/app/http/errors/domain-error';
import { LoginUseCase } from '../../../../../../src/core/application/use-cases/auth/login';
import { AccountStatus, UserRole } from '../../../../../../src/core/domain';
import { JWTService } from '../../../../../../src/core/infra/auth/jwt-service';
import { Argon2PasswordHasher } from '../../../../../../src/core/infra/auth/password-hasher';
import { MockUserRepository } from '../../../domain/repositories/mock-user-repository';

describe('LoginUseCase', () => {
	const jwtSecret = 'test-secret-key-that-is-at-least-32-characters-long';
	const jwtService = new JWTService(jwtSecret);
	const passwordHasher = new Argon2PasswordHasher();

	it('deve fazer login com credenciais válidas e conta ACTIVE', async () => {
		const repository = new MockUserRepository();
		const useCase = new LoginUseCase(repository, passwordHasher, jwtService);

		// Cria usuário com senha hasheada
		const passwordHash = await passwordHasher.hash('securePassword123');
		await repository.create({
			name: 'John Doe',
			email: 'john@example.com',
			passwordHash,
			role: UserRole.CUSTOMER,
			accountStatus: AccountStatus.ACTIVE,
		});

		const result = await useCase.execute({
			email: 'john@example.com',
			password: 'securePassword123',
		});

		expect(result.user).toBeDefined();
		expect(result.user.email).toBe('john@example.com');
		expect(result.token).toBeDefined();
		expect(result.expiresIn).toBe(604800);

		// Valida token
		const validation = jwtService.validate(result.token);
		expect(validation.valid).toBe(true);
		expect(validation.payload?.email).toBe('john@example.com');
	});

	it('deve normalizar email e retornar expiração maior quando rememberMe está ativo', async () => {
		const repository = new MockUserRepository();
		const useCase = new LoginUseCase(repository, passwordHasher, jwtService);

		const passwordHash = await passwordHasher.hash('securePassword123');
		await repository.create({
			name: 'John Doe',
			email: 'john@example.com',
			passwordHash,
			role: UserRole.CUSTOMER,
			accountStatus: AccountStatus.ACTIVE,
		});

		const result = await useCase.execute({
			email: ' JOHN@EXAMPLE.COM ',
			password: 'securePassword123',
			rememberMe: true,
		});

		expect(result.user.email).toBe('john@example.com');
		expect(result.expiresIn).toBe(2592000);
	});

	it('deve lançar AuthError para email inexistente', async () => {
		const repository = new MockUserRepository();
		const useCase = new LoginUseCase(repository, passwordHasher, jwtService);

		await expect(
			useCase.execute({
				email: 'nonexistent@example.com',
				password: 'anyPassword',
			}),
		).rejects.toThrow(AuthError);
	});

	it('deve lançar AuthError para senha incorreta', async () => {
		const repository = new MockUserRepository();
		const useCase = new LoginUseCase(repository, passwordHasher, jwtService);

		const passwordHash = await passwordHasher.hash('correctPassword');
		await repository.create({
			name: 'John Doe',
			email: 'john@example.com',
			passwordHash,
			role: UserRole.CUSTOMER,
			accountStatus: AccountStatus.ACTIVE,
		});

		await expect(
			useCase.execute({
				email: 'john@example.com',
				password: 'wrongPassword',
			}),
		).rejects.toThrow(AuthError);
	});

	it('deve lançar DomainError para conta INACTIVE', async () => {
		const repository = new MockUserRepository();
		const useCase = new LoginUseCase(repository, passwordHasher, jwtService);

		const passwordHash = await passwordHasher.hash('securePassword123');
		await repository.create({
			name: 'John Doe',
			email: 'john@example.com',
			passwordHash,
			role: UserRole.CUSTOMER,
			accountStatus: AccountStatus.INACTIVE,
		});

		await expect(
			useCase.execute({
				email: 'john@example.com',
				password: 'securePassword123',
			}),
		).rejects.toThrow(DomainError);
	});

	it('deve lançar DomainError para conta SUSPENDED', async () => {
		const repository = new MockUserRepository();
		const useCase = new LoginUseCase(repository, passwordHasher, jwtService);

		const passwordHash = await passwordHasher.hash('securePassword123');
		await repository.create({
			name: 'John Doe',
			email: 'john@example.com',
			passwordHash,
			role: UserRole.CUSTOMER,
			accountStatus: AccountStatus.SUSPENDED,
		});

		await expect(
			useCase.execute({
				email: 'john@example.com',
				password: 'securePassword123',
			}),
		).rejects.toThrow(DomainError);
	});

	it('deve lançar DomainError para conta PENDING_VERIFICATION', async () => {
		const repository = new MockUserRepository();
		const useCase = new LoginUseCase(repository, passwordHasher, jwtService);

		const passwordHash = await passwordHasher.hash('securePassword123');
		await repository.create({
			name: 'John Doe',
			email: 'john@example.com',
			passwordHash,
			role: UserRole.CUSTOMER,
			accountStatus: AccountStatus.PENDING_VERIFICATION,
		});

		await expect(
			useCase.execute({
				email: 'john@example.com',
				password: 'securePassword123',
			}),
		).rejects.toThrow(DomainError);
	});

	it('deve incluir detalhes do status no erro quando conta não pode autenticar', async () => {
		const repository = new MockUserRepository();
		const useCase = new LoginUseCase(repository, passwordHasher, jwtService);

		const passwordHash = await passwordHasher.hash('securePassword123');
		await repository.create({
			name: 'John Doe',
			email: 'john@example.com',
			passwordHash,
			role: UserRole.CUSTOMER,
			accountStatus: AccountStatus.SUSPENDED,
		});

		try {
			await useCase.execute({
				email: 'john@example.com',
				password: 'securePassword123',
			});
			expect.fail('Deveria ter lançado erro');
		} catch (error) {
			expect(error).toBeInstanceOf(DomainError);
			if (error instanceof DomainError) {
				expect(error.details).toBeDefined();
				expect(
					(error.details as { accountStatus: AccountStatus }).accountStatus,
				).toBe(AccountStatus.SUSPENDED);
			}
		}
	});

	it('deve funcionar com usuário ADMIN', async () => {
		const repository = new MockUserRepository();
		const useCase = new LoginUseCase(repository, passwordHasher, jwtService);

		const passwordHash = await passwordHasher.hash('securePassword123');
		await repository.create({
			name: 'Admin User',
			email: 'admin@example.com',
			passwordHash,
			role: UserRole.SUPER_ADMIN,
			accountStatus: AccountStatus.ACTIVE,
		});

		const result = await useCase.execute({
			email: 'admin@example.com',
			password: 'securePassword123',
		});

		expect(result.user.role).toBe(UserRole.SUPER_ADMIN);
		const validation = jwtService.validate(result.token);
		expect(validation.payload?.role).toBe(UserRole.SUPER_ADMIN);
	});
});
