import { AuthError } from '../../../../app/http/errors/auth-error';
import { DomainError } from '../../../../app/http/errors/domain-error';
import { AccountStatus } from '../../../domain/entities/user';
import type { UserRepository } from '../../../domain/repositories/user-repository';
import { AccountStatusVO } from '../../../domain/value-objects/account-status';
import type { PasswordHasher } from '../../../domain/value-objects/password';
import { Password } from '../../../domain/value-objects/password';
import type { JWTService } from '../../../infra/auth/jwt-service';

/**
 * DTO de entrada para login
 */
export interface LoginInput {
	email: string;
	password: string;
}

/**
 * DTO de saída para login
 */
export interface LoginOutput {
	user: {
		id: string;
		name: string;
		email: string;
		role: string;
		accountStatus: AccountStatus;
	};
	token: string;
}

/**
 * Caso de uso: Autenticar usuário
 * Valida credenciais, verifica status da conta e retorna token JWT
 */
export class LoginUseCase {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly passwordHasher: PasswordHasher,
		private readonly jwtService: JWTService,
	) {}

	async execute(input: LoginInput): Promise<LoginOutput> {
		// Busca usuário por email
		const user = await this.userRepository.findByEmail(input.email);
		if (!user) {
			throw new AuthError('Credenciais inválidas');
		}

		// Verifica status da conta usando Value Object
		const accountStatus = AccountStatusVO.from(user.accountStatus);
		if (!accountStatus.canAuthenticate()) {
			throw new DomainError(
				`Conta não pode autenticar. Status: ${accountStatus.toString()}`,
				{
					details: {
						accountStatus: user.accountStatus,
						reason: this.getStatusReason(user.accountStatus),
					},
				},
			);
		}

		// Verifica senha
		const password = Password.fromHash(user.passwordHash);
		const isValidPassword = await password.verify(
			input.password,
			this.passwordHasher,
		);

		if (!isValidPassword) {
			throw new AuthError('Credenciais inválidas');
		}

		// Gera token JWT
		const token = this.jwtService.generate({
			userId: user.id,
			email: user.email,
			role: user.role,
		});

		return {
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				accountStatus: user.accountStatus,
			},
			token,
		};
	}

	/**
	 * Retorna mensagem descritiva do motivo pelo qual a conta não pode autenticar
	 */
	private getStatusReason(status: AccountStatus): string {
		switch (status) {
			case AccountStatus.INACTIVE:
				return 'Conta inativa. Entre em contato com o suporte para reativar.';
			case AccountStatus.SUSPENDED:
				return 'Conta suspensa. Entre em contato com o suporte.';
			case AccountStatus.PENDING_VERIFICATION:
				return 'Conta aguardando verificação. Verifique seu email.';
			default:
				return 'Conta não pode autenticar.';
		}
	}
}
