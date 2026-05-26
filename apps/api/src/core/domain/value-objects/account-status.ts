import { AccountStatus } from '../entities/user';

/**
 * Value Object para AccountStatus
 * Encapsula lógica de negócio relacionada ao status da conta
 */
export class AccountStatusVO {
	private constructor(private readonly statusValue: AccountStatus) {}

	/**
	 * Cria AccountStatusVO a partir de um valor do enum
	 * @param status - Status da conta
	 * @returns Instância de AccountStatusVO
	 */
	static from(status: AccountStatus): AccountStatusVO {
		return new AccountStatusVO(status);
	}

	/**
	 * Cria AccountStatusVO a partir de uma string
	 * @param status - String representando o status
	 * @returns Instância de AccountStatusVO
	 * @throws Error se o status não for válido
	 */
	static fromString(status: string): AccountStatusVO {
		if (!Object.values(AccountStatus).includes(status as AccountStatus)) {
			throw new Error(`Invalid account status: ${status}`);
		}

		return new AccountStatusVO(status as AccountStatus);
	}

	/**
	 * Retorna o valor do status
	 */
	get value(): AccountStatus {
		return this.statusValue;
	}

	/**
	 * Verifica se a conta pode autenticar na aplicação
	 * Apenas contas ACTIVE podem autenticar
	 * @returns true se pode autenticar, false caso contrário
	 */
	canAuthenticate(): boolean {
		return this.statusValue === AccountStatus.ACTIVE;
	}

	/**
	 * Verifica se a conta está ativa
	 * @returns true se status é ACTIVE
	 */
	isActive(): boolean {
		return this.statusValue === AccountStatus.ACTIVE;
	}

	/**
	 * Verifica se a conta está inativa
	 * @returns true se status é INACTIVE
	 */
	isInactive(): boolean {
		return this.statusValue === AccountStatus.INACTIVE;
	}

	/**
	 * Verifica se a conta está suspensa
	 * @returns true se status é SUSPENDED
	 */
	isSuspended(): boolean {
		return this.statusValue === AccountStatus.SUSPENDED;
	}

	/**
	 * Verifica se a conta está pendente de verificação
	 * @returns true se status é PENDING_VERIFICATION
	 */
	isPendingVerification(): boolean {
		return this.statusValue === AccountStatus.PENDING_VERIFICATION;
	}

	/**
	 * Verifica se dois AccountStatusVO são iguais
	 * @param other - Outro AccountStatusVO para comparação
	 * @returns true se são iguais
	 */
	equals(other: AccountStatusVO): boolean {
		return this.statusValue === other.statusValue;
	}

	/**
	 * Retorna representação em string do status
	 */
	toString(): string {
		return this.statusValue;
	}
}
