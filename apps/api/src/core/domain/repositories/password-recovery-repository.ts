import type { PasswordRecoveryRequest } from '../entities/password-recovery';

export interface PasswordRecoveryRepository {
	create(
		request: Omit<PasswordRecoveryRequest, 'id' | 'createdAt' | 'updatedAt'>,
	): Promise<PasswordRecoveryRequest>;
	findActiveByEmail(email: string): Promise<PasswordRecoveryRequest | null>;
	findByResetToken(resetToken: string): Promise<PasswordRecoveryRequest | null>;
	invalidateActiveByEmail(email: string): Promise<void>;
	invalidateByUserId(userId: string): Promise<void>;
	update(
		id: string,
		request: Partial<
			Omit<PasswordRecoveryRequest, 'id' | 'createdAt' | 'updatedAt'>
		>,
	): Promise<PasswordRecoveryRequest | null>;
}
