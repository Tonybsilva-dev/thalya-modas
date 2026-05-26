import { AccountStatus, type User, UserRole } from '../../src/core/domain';

/**
 * Factory para criar instâncias de User para testes
 * Segue o padrão Factory para reduzir duplicação e melhorar legibilidade dos testes
 */

/**
 * Cria um usuário com valores padrão que podem ser sobrescritos
 */
export function createUser(overrides?: Partial<User>): User {
	const now = new Date();
	const defaultUser: User = {
		id: crypto.randomUUID(),
		name: 'John Doe',
		email: `john.doe.${Date.now()}@example.com`,
		passwordHash: '$2a$10$dummy.hash.here.for.testing.purposes',
		role: UserRole.CUSTOMER,
		accountStatus: AccountStatus.ACTIVE,
		createdAt: now,
		updatedAt: now,
	};

	return {
		...defaultUser,
		...overrides,
	};
}

/**
 * Cria um usuário admin
 */
export function createAdminUser(overrides?: Partial<User>): User {
	return createUser({
		role: UserRole.SUPER_ADMIN,
		...overrides,
	});
}

/**
 * Cria um usuário com status inativo
 */
export function createInactiveUser(overrides?: Partial<User>): User {
	return createUser({
		accountStatus: AccountStatus.INACTIVE,
		...overrides,
	});
}

/**
 * Cria um usuário com status suspenso
 */
export function createSuspendedUser(overrides?: Partial<User>): User {
	return createUser({
		accountStatus: AccountStatus.SUSPENDED,
		...overrides,
	});
}

/**
 * Cria um usuário com status pendente de verificação
 */
export function createPendingVerificationUser(overrides?: Partial<User>): User {
	return createUser({
		accountStatus: AccountStatus.PENDING_VERIFICATION,
		...overrides,
	});
}

/**
 * Cria dados para registro de usuário (sem id, createdAt, updatedAt, passwordHash)
 */
export function createRegisterData(overrides?: {
	name?: string;
	email?: string;
	password?: string;
	role?: UserRole;
	accountStatus?: AccountStatus;
}): {
	name: string;
	email: string;
	password: string;
	role?: UserRole;
	accountStatus?: AccountStatus;
} {
	return {
		name: 'John Doe',
		email: `john.doe.${Date.now()}@example.com`,
		password: 'password123',
		...overrides,
	};
}

/**
 * @deprecated Use createUser() instead
 * Mantido para compatibilidade com testes existentes
 */
export const UserFactory = {
	create: createUser,
	createAdmin: createAdminUser,
	createInactive: createInactiveUser,
	createSuspended: createSuspendedUser,
	createPendingVerification: createPendingVerificationUser,
	createRegisterData,
} as const;
