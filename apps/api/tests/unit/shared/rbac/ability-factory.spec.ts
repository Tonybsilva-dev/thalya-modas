import { describe, expect, it } from 'vitest';
import { UserRole } from '../../../../src/core/domain';
import {
	createAbilityForUser,
	createEmptyAbility,
} from '../../../../src/shared/rbac/ability-factory';
import type { AuthenticatedUser } from '../../../../src/shared/rbac/types';
import { Action, Subject } from '../../../../src/shared/rbac/types';

describe('createAbilityForUser', () => {
	describe('ROLE_CUSTOMER (self-only)', () => {
		it('deve permitir que usuário leia seus próprios dados', () => {
			const user: AuthenticatedUser = {
				id: 'user-123',
				email: 'user@example.com',
				role: UserRole.CUSTOMER,
			};

			const ability = createAbilityForUser(user);

			expect(ability.can(Action.READ, Subject.USER)).toBe(true);
		});

		it('deve permitir que usuário atualize seus próprios dados', () => {
			const user: AuthenticatedUser = {
				id: 'user-123',
				email: 'user@example.com',
				role: UserRole.CUSTOMER,
			};

			const ability = createAbilityForUser(user);

			expect(ability.can(Action.UPDATE, Subject.USER)).toBe(true);
		});

		it('NÃO deve permitir que usuário delete recursos', () => {
			const user: AuthenticatedUser = {
				id: 'user-123',
				email: 'user@example.com',
				role: UserRole.CUSTOMER,
			};

			const ability = createAbilityForUser(user);

			expect(ability.cannot(Action.DELETE, Subject.USER)).toBe(true);
		});

		it('deve permitir que usuário leia e atualize apenas seus próprios dados (condições aplicadas)', () => {
			const user: AuthenticatedUser = {
				id: 'user-123',
				email: 'user@example.com',
				role: UserRole.CUSTOMER,
			};

			const ability = createAbilityForUser(user);

			expect(ability.can(Action.READ, Subject.USER)).toBe(true);
			expect(ability.can(Action.UPDATE, Subject.USER)).toBe(true);
			expect(ability.cannot(Action.DELETE, Subject.USER)).toBe(true);
			expect(ability.cannot(Action.CREATE, Subject.USER)).toBe(true);
		});

		it('NÃO deve permitir que usuário crie recursos', () => {
			const user: AuthenticatedUser = {
				id: 'user-123',
				email: 'user@example.com',
				role: UserRole.CUSTOMER,
			};

			const ability = createAbilityForUser(user);

			expect(ability.can(Action.CREATE, Subject.USER)).toBe(false);
		});

		it('NÃO deve permitir que usuário gerencie todos os recursos', () => {
			const user: AuthenticatedUser = {
				id: 'user-123',
				email: 'user@example.com',
				role: UserRole.CUSTOMER,
			};

			const ability = createAbilityForUser(user);

			expect(ability.can(Action.MANAGE, Subject.ALL)).toBe(false);
		});
	});

	describe('ROLE_SUPER_ADMIN (full access)', () => {
		it('deve permitir que super admin gerencie todos os recursos', () => {
			const admin: AuthenticatedUser = {
				id: 'admin-123',
				email: 'admin@example.com',
				role: UserRole.SUPER_ADMIN,
			};

			const ability = createAbilityForUser(admin);

			expect(ability.can(Action.MANAGE, Subject.ALL)).toBe(true);
		});

		it('deve permitir que super admin leia qualquer usuário', () => {
			const admin: AuthenticatedUser = {
				id: 'admin-123',
				email: 'admin@example.com',
				role: UserRole.SUPER_ADMIN,
			};

			const ability = createAbilityForUser(admin);

			expect(ability.can(Action.READ, Subject.USER)).toBe(true);
		});

		it('deve permitir que super admin atualize qualquer usuário', () => {
			const admin: AuthenticatedUser = {
				id: 'admin-123',
				email: 'admin@example.com',
				role: UserRole.SUPER_ADMIN,
			};

			const ability = createAbilityForUser(admin);

			expect(ability.can(Action.UPDATE, Subject.USER)).toBe(true);
		});

		it('deve permitir que super admin delete qualquer usuário', () => {
			const admin: AuthenticatedUser = {
				id: 'admin-123',
				email: 'admin@example.com',
				role: UserRole.SUPER_ADMIN,
			};

			const ability = createAbilityForUser(admin);

			expect(ability.can(Action.DELETE, Subject.USER)).toBe(true);
		});

		it('deve permitir que super admin crie recursos', () => {
			const admin: AuthenticatedUser = {
				id: 'admin-123',
				email: 'admin@example.com',
				role: UserRole.SUPER_ADMIN,
			};

			const ability = createAbilityForUser(admin);

			expect(ability.can(Action.CREATE, Subject.USER)).toBe(true);
		});
	});

	describe('ROLE_COMPANY (full access)', () => {
		it('deve permitir que company gerencie todos os recursos', () => {
			const company: AuthenticatedUser = {
				id: 'company-123',
				email: 'company@example.com',
				role: UserRole.COMPANY,
			};

			const ability = createAbilityForUser(company);

			expect(ability.can(Action.MANAGE, Subject.ALL)).toBe(true);
		});
	});

	describe('ROLE_EMPLOYEE (self-only)', () => {
		it('deve permitir apenas leitura e atualização dos próprios dados', () => {
			const employee: AuthenticatedUser = {
				id: 'emp-123',
				email: 'employee@example.com',
				role: UserRole.EMPLOYEE,
			};

			const ability = createAbilityForUser(employee);

			expect(ability.can(Action.READ, Subject.USER)).toBe(true);
			expect(ability.can(Action.UPDATE, Subject.USER)).toBe(true);
			expect(ability.cannot(Action.DELETE, Subject.USER)).toBe(true);
			expect(ability.cannot(Action.CREATE, Subject.USER)).toBe(true);
			expect(ability.can(Action.MANAGE, Subject.ALL)).toBe(false);
		});
	});

	describe('ROLE_DELIVERY_MAN (self-only)', () => {
		it('deve permitir apenas leitura e atualização dos próprios dados', () => {
			const delivery: AuthenticatedUser = {
				id: 'delivery-123',
				email: 'delivery@example.com',
				role: UserRole.DELIVERY_MAN,
			};

			const ability = createAbilityForUser(delivery);

			expect(ability.can(Action.READ, Subject.USER)).toBe(true);
			expect(ability.can(Action.UPDATE, Subject.USER)).toBe(true);
			expect(ability.cannot(Action.DELETE, Subject.USER)).toBe(true);
			expect(ability.cannot(Action.MANAGE, Subject.ALL)).toBe(true);
		});
	});

	describe('Edge cases', () => {
		it('deve retornar ability vazia para role desconhecido', () => {
			const userWithUnknownRole = {
				id: 'user-123',
				email: 'user@example.com',
				role: 'UNKNOWN_ROLE' as UserRole,
			};

			const ability = createAbilityForUser(userWithUnknownRole);

			expect(ability.can(Action.READ, Subject.USER)).toBe(false);
			expect(ability.can(Action.MANAGE, Subject.ALL)).toBe(false);
		});
	});
});

describe('createEmptyAbility', () => {
	it('deve retornar ability sem permissões', () => {
		const ability = createEmptyAbility();

		expect(ability.can(Action.READ, Subject.USER)).toBe(false);
		expect(ability.can(Action.MANAGE, Subject.ALL)).toBe(false);
		expect(ability.can(Action.CREATE, Subject.USER)).toBe(false);
	});
});
