import { describe, expect, it } from 'vitest';
import { NotFoundError } from '../../../../../../src/app/http/errors/not-found-error';
import { GetCurrentUserUseCase } from '../../../../../../src/core/application/use-cases/auth/get-current-user';
import { AccountStatus, UserRole } from '../../../../../../src/core/domain';
import { MockUserRepository } from '../../../domain/repositories/mock-user-repository';

describe('GetCurrentUserUseCase', () => {
	it('deve retornar dados do usuário quando encontrado', async () => {
		const repository = new MockUserRepository();
		const useCase = new GetCurrentUserUseCase(repository);

		const user = await repository.create({
			name: 'John Doe',
			email: 'john@example.com',
			passwordHash: 'hashed:password',
			role: UserRole.CUSTOMER,
			accountStatus: AccountStatus.ACTIVE,
		});

		const result = await useCase.execute({ userId: user.id });

		expect(result.id).toBe(user.id);
		expect(result.name).toBe(user.name);
		expect(result.email).toBe(user.email);
		expect(result.role).toBe(user.role);
		expect(result.accountStatus).toBe(user.accountStatus);
		expect(result.createdAt).toBeInstanceOf(Date);
		expect(result.updatedAt).toBeInstanceOf(Date);
	});

	it('deve lançar NotFoundError quando usuário não existe', async () => {
		const repository = new MockUserRepository();
		const useCase = new GetCurrentUserUseCase(repository);

		await expect(
			useCase.execute({ userId: 'non-existent-id' }),
		).rejects.toThrow(NotFoundError);
	});

	it('deve retornar dados completos incluindo accountStatus', async () => {
		const repository = new MockUserRepository();
		const useCase = new GetCurrentUserUseCase(repository);

		const user = await repository.create({
			name: 'John Doe',
			email: 'john@example.com',
			passwordHash: 'hashed:password',
			role: UserRole.CUSTOMER,
			accountStatus: AccountStatus.PENDING_VERIFICATION,
		});

		const result = await useCase.execute({ userId: user.id });

		expect(result.accountStatus).toBe(AccountStatus.PENDING_VERIFICATION);
	});
});
