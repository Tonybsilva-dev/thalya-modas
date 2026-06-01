import { randomBytes, randomInt } from 'node:crypto';
import { AuthError } from '../../../../app/http/errors/auth-error';
import { DomainError } from '../../../../app/http/errors/domain-error';
import { NotFoundError } from '../../../../app/http/errors/not-found-error';
import { AccountStatus } from '../../../domain/entities/user';
import type { PasswordRecoveryRepository } from '../../../domain/repositories/password-recovery-repository';
import type { UserRepository } from '../../../domain/repositories/user-repository';
import type { PasswordHasher } from '../../../domain/value-objects/password';
import { Password } from '../../../domain/value-objects/password';

const codeTtlMs = 10 * 60 * 1000;
const resetTokenTtlMs = 10 * 60 * 1000;
const resendCooldownMs = 30 * 1000;
const maxInvalidAttempts = 5;

export interface PasswordRecoveryRequestOutput {
	accepted: true;
	debugCode?: string;
	expiresIn: number;
	resendAvailableIn: number;
}

export interface PasswordRecoveryVerifyCodeOutput {
	expiresIn: number;
	resetToken: string;
}

export class RequestPasswordRecoveryUseCase {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly passwordRecoveryRepository: PasswordRecoveryRepository,
	) {}

	async execute(input: {
		email: string;
		includeDebugCode?: boolean;
	}): Promise<PasswordRecoveryRequestOutput> {
		const email = normalizeEmail(input.email);
		const now = new Date();
		const codeExpiresAt = new Date(now.getTime() + codeTtlMs);
		const resendAvailableAt = new Date(now.getTime() + resendCooldownMs);
		const output: PasswordRecoveryRequestOutput = {
			accepted: true,
			expiresIn: secondsUntil(codeExpiresAt, now),
			resendAvailableIn: secondsUntil(resendAvailableAt, now),
		};
		const user = await this.userRepository.findByEmail(email);

		if (!user || user.accountStatus !== AccountStatus.ACTIVE) {
			return output;
		}

		await this.passwordRecoveryRepository.invalidateActiveByEmail(email);

		const code = generateCode();
		await this.passwordRecoveryRepository.create({
			email,
			userId: user.id,
			code,
			codeExpiresAt,
			invalidAttempts: 0,
			resendAvailableAt,
			status: 'PENDING',
		});

		return {
			...output,
			debugCode: input.includeDebugCode ? code : undefined,
		};
	}
}

export class VerifyPasswordRecoveryCodeUseCase {
	constructor(
		private readonly passwordRecoveryRepository: PasswordRecoveryRepository,
	) {}

	async execute(input: {
		email: string;
		code: string;
	}): Promise<PasswordRecoveryVerifyCodeOutput> {
		const request = await this.passwordRecoveryRepository.findActiveByEmail(
			normalizeEmail(input.email),
		);
		const now = new Date();

		if (!request || request.status !== 'PENDING') {
			throw new AuthError('Código inválido ou expirado');
		}

		if (request.codeExpiresAt.getTime() <= now.getTime()) {
			await this.passwordRecoveryRepository.update(request.id, {
				status: 'BLOCKED',
			});
			throw new AuthError('Código inválido ou expirado');
		}

		if (request.code !== input.code) {
			const invalidAttempts = request.invalidAttempts + 1;
			await this.passwordRecoveryRepository.update(request.id, {
				invalidAttempts,
				status: invalidAttempts >= maxInvalidAttempts ? 'BLOCKED' : 'PENDING',
			});
			throw new AuthError('Código inválido ou expirado');
		}

		const resetTokenExpiresAt = new Date(now.getTime() + resetTokenTtlMs);
		const resetToken = generateResetToken();
		await this.passwordRecoveryRepository.update(request.id, {
			resetToken,
			resetTokenExpiresAt,
			status: 'TOKEN_ISSUED',
		});

		return {
			resetToken,
			expiresIn: secondsUntil(resetTokenExpiresAt, now),
		};
	}
}

export class ResendPasswordRecoveryCodeUseCase {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly passwordRecoveryRepository: PasswordRecoveryRepository,
	) {}

	async execute(input: {
		email: string;
		includeDebugCode?: boolean;
	}): Promise<PasswordRecoveryRequestOutput> {
		const email = normalizeEmail(input.email);
		const currentRequest =
			await this.passwordRecoveryRepository.findActiveByEmail(email);
		const now = new Date();

		if (
			currentRequest &&
			currentRequest.resendAvailableAt.getTime() > now.getTime()
		) {
			throw new DomainError('Aguarde antes de solicitar um novo código.', {
				details: {
					retryAfter: secondsUntil(currentRequest.resendAvailableAt, now),
				},
			});
		}

		const user = await this.userRepository.findByEmail(email);
		const codeExpiresAt = new Date(now.getTime() + codeTtlMs);
		const resendAvailableAt = new Date(now.getTime() + resendCooldownMs);
		const output: PasswordRecoveryRequestOutput = {
			accepted: true,
			expiresIn: secondsUntil(codeExpiresAt, now),
			resendAvailableIn: secondsUntil(resendAvailableAt, now),
		};

		if (!user || user.accountStatus !== AccountStatus.ACTIVE) {
			return output;
		}

		await this.passwordRecoveryRepository.invalidateActiveByEmail(email);

		const code = generateCode();
		await this.passwordRecoveryRepository.create({
			email,
			userId: user.id,
			code,
			codeExpiresAt,
			invalidAttempts: 0,
			resendAvailableAt,
			status: 'PENDING',
		});

		return {
			...output,
			debugCode: input.includeDebugCode ? code : undefined,
		};
	}
}

export class ResetPasswordUseCase {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly passwordRecoveryRepository: PasswordRecoveryRepository,
		private readonly passwordHasher: PasswordHasher,
	) {}

	async execute(input: {
		resetToken: string;
		password: string;
		passwordConfirmation: string;
	}): Promise<{ success: true }> {
		if (input.password !== input.passwordConfirmation) {
			throw new DomainError('As senhas não conferem.');
		}

		assertStrongPassword(input.password);

		const request = await this.passwordRecoveryRepository.findByResetToken(
			input.resetToken,
		);
		const now = new Date();

		if (
			!request ||
			request.status !== 'TOKEN_ISSUED' ||
			!request.resetTokenExpiresAt ||
			request.resetTokenExpiresAt.getTime() <= now.getTime()
		) {
			throw new AuthError('Token de recuperação inválido ou expirado');
		}

		const password = await Password.fromPlain(
			input.password,
			this.passwordHasher,
		);
		const user = await this.userRepository.update(request.userId, {
			passwordHash: password.hash,
		});

		if (!user) {
			throw new NotFoundError('Usuário não encontrado');
		}

		await this.passwordRecoveryRepository.invalidateByUserId(request.userId);

		return { success: true };
	}
}

function assertStrongPassword(password: string): void {
	if (
		password.length < 8 ||
		!/[A-Z]/.test(password) ||
		!/[0-9]/.test(password)
	) {
		throw new DomainError(
			'A senha deve ter pelo menos 8 caracteres, uma letra maiúscula e um número.',
		);
	}
}

function generateCode(): string {
	return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function generateResetToken(): string {
	return randomBytes(32).toString('hex');
}

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

function secondsUntil(date: Date, from: Date): number {
	return Math.max(0, Math.ceil((date.getTime() - from.getTime()) / 1000));
}
