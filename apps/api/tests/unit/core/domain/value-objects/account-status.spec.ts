import { describe, expect, it } from 'vitest';
import { AccountStatus } from '../../../../../src/core/domain';
import { AccountStatusVO } from '../../../../../src/core/domain/value-objects/account-status';

describe('AccountStatusVO', () => {
	describe('from', () => {
		it('deve criar AccountStatusVO a partir de enum ACTIVE', () => {
			const status = AccountStatusVO.from(AccountStatus.ACTIVE);
			expect(status.toString()).toBe(AccountStatus.ACTIVE);
		});

		it('deve criar AccountStatusVO a partir de enum INACTIVE', () => {
			const status = AccountStatusVO.from(AccountStatus.INACTIVE);
			expect(status.toString()).toBe(AccountStatus.INACTIVE);
		});

		it('deve criar AccountStatusVO a partir de enum SUSPENDED', () => {
			const status = AccountStatusVO.from(AccountStatus.SUSPENDED);
			expect(status.toString()).toBe(AccountStatus.SUSPENDED);
		});

		it('deve criar AccountStatusVO a partir de enum PENDING_VERIFICATION', () => {
			const status = AccountStatusVO.from(AccountStatus.PENDING_VERIFICATION);
			expect(status.toString()).toBe(AccountStatus.PENDING_VERIFICATION);
		});
	});

	describe('fromString', () => {
		it('deve criar AccountStatusVO a partir de string válida', () => {
			const status = AccountStatusVO.fromString('ACTIVE');
			expect(status.toString()).toBe(AccountStatus.ACTIVE);
		});

		it('deve lançar erro para string inválida', () => {
			expect(() => {
				AccountStatusVO.fromString('INVALID_STATUS');
			}).toThrow('Invalid account status: INVALID_STATUS');
		});
	});

	describe('canAuthenticate', () => {
		it('deve retornar true para ACTIVE', () => {
			const status = AccountStatusVO.from(AccountStatus.ACTIVE);
			expect(status.canAuthenticate()).toBe(true);
		});

		it('deve retornar false para INACTIVE', () => {
			const status = AccountStatusVO.from(AccountStatus.INACTIVE);
			expect(status.canAuthenticate()).toBe(false);
		});

		it('deve retornar false para SUSPENDED', () => {
			const status = AccountStatusVO.from(AccountStatus.SUSPENDED);
			expect(status.canAuthenticate()).toBe(false);
		});

		it('deve retornar false para PENDING_VERIFICATION', () => {
			const status = AccountStatusVO.from(AccountStatus.PENDING_VERIFICATION);
			expect(status.canAuthenticate()).toBe(false);
		});
	});

	describe('isActive', () => {
		it('deve retornar true para ACTIVE', () => {
			const status = AccountStatusVO.from(AccountStatus.ACTIVE);
			expect(status.isActive()).toBe(true);
		});

		it('deve retornar false para outros status', () => {
			expect(AccountStatusVO.from(AccountStatus.INACTIVE).isActive()).toBe(
				false,
			);
			expect(AccountStatusVO.from(AccountStatus.SUSPENDED).isActive()).toBe(
				false,
			);
			expect(
				AccountStatusVO.from(AccountStatus.PENDING_VERIFICATION).isActive(),
			).toBe(false);
		});
	});

	describe('isInactive', () => {
		it('deve retornar true para INACTIVE', () => {
			const status = AccountStatusVO.from(AccountStatus.INACTIVE);
			expect(status.isInactive()).toBe(true);
		});

		it('deve retornar false para outros status', () => {
			expect(AccountStatusVO.from(AccountStatus.ACTIVE).isInactive()).toBe(
				false,
			);
			expect(AccountStatusVO.from(AccountStatus.SUSPENDED).isInactive()).toBe(
				false,
			);
			expect(
				AccountStatusVO.from(AccountStatus.PENDING_VERIFICATION).isInactive(),
			).toBe(false);
		});
	});

	describe('isSuspended', () => {
		it('deve retornar true para SUSPENDED', () => {
			const status = AccountStatusVO.from(AccountStatus.SUSPENDED);
			expect(status.isSuspended()).toBe(true);
		});

		it('deve retornar false para outros status', () => {
			expect(AccountStatusVO.from(AccountStatus.ACTIVE).isSuspended()).toBe(
				false,
			);
			expect(AccountStatusVO.from(AccountStatus.INACTIVE).isSuspended()).toBe(
				false,
			);
			expect(
				AccountStatusVO.from(AccountStatus.PENDING_VERIFICATION).isSuspended(),
			).toBe(false);
		});
	});

	describe('isPendingVerification', () => {
		it('deve retornar true para PENDING_VERIFICATION', () => {
			const status = AccountStatusVO.from(AccountStatus.PENDING_VERIFICATION);
			expect(status.isPendingVerification()).toBe(true);
		});

		it('deve retornar false para outros status', () => {
			expect(
				AccountStatusVO.from(AccountStatus.ACTIVE).isPendingVerification(),
			).toBe(false);
			expect(
				AccountStatusVO.from(AccountStatus.INACTIVE).isPendingVerification(),
			).toBe(false);
			expect(
				AccountStatusVO.from(AccountStatus.SUSPENDED).isPendingVerification(),
			).toBe(false);
		});
	});

	describe('equals', () => {
		it('deve retornar true para status iguais', () => {
			const status1 = AccountStatusVO.from(AccountStatus.ACTIVE);
			const status2 = AccountStatusVO.from(AccountStatus.ACTIVE);
			expect(status1.equals(status2)).toBe(true);
		});

		it('deve retornar false para status diferentes', () => {
			const status1 = AccountStatusVO.from(AccountStatus.ACTIVE);
			const status2 = AccountStatusVO.from(AccountStatus.INACTIVE);
			expect(status1.equals(status2)).toBe(false);
		});
	});

	describe('toString', () => {
		it('deve retornar string do status', () => {
			const status = AccountStatusVO.from(AccountStatus.ACTIVE);
			expect(status.toString()).toBe('ACTIVE');
		});
	});
});
