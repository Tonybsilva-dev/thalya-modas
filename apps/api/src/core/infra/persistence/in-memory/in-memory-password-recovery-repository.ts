import type {
	PasswordRecoveryRequest,
	PasswordRecoveryStatus,
} from '../../../domain/entities/password-recovery';
import type { PasswordRecoveryRepository } from '../../../domain/repositories/password-recovery-repository';

const inactiveStatuses = new Set<PasswordRecoveryStatus>([
	'BLOCKED',
	'RESET_USED',
]);

export class InMemoryPasswordRecoveryRepository
	implements PasswordRecoveryRepository
{
	private requests: Map<string, PasswordRecoveryRequest> = new Map();

	async create(
		requestData: Omit<
			PasswordRecoveryRequest,
			'id' | 'createdAt' | 'updatedAt'
		>,
	): Promise<PasswordRecoveryRequest> {
		const now = new Date();
		const request: PasswordRecoveryRequest = {
			...requestData,
			id: crypto.randomUUID(),
			createdAt: now,
			updatedAt: now,
		};
		this.requests.set(request.id, request);
		return request;
	}

	async findActiveByEmail(
		email: string,
	): Promise<PasswordRecoveryRequest | null> {
		const normalizedEmail = email.toLowerCase();

		for (const request of this.requests.values()) {
			if (
				request.email === normalizedEmail &&
				!inactiveStatuses.has(request.status)
			) {
				return request;
			}
		}

		return null;
	}

	async findByResetToken(
		resetToken: string,
	): Promise<PasswordRecoveryRequest | null> {
		for (const request of this.requests.values()) {
			if (request.resetToken === resetToken) {
				return request;
			}
		}

		return null;
	}

	async invalidateActiveByEmail(email: string): Promise<void> {
		const normalizedEmail = email.toLowerCase();

		for (const request of this.requests.values()) {
			if (
				request.email === normalizedEmail &&
				!inactiveStatuses.has(request.status)
			) {
				await this.update(request.id, {
					status: 'RESET_USED',
					resetToken: undefined,
					resetTokenExpiresAt: undefined,
				});
			}
		}
	}

	async invalidateByUserId(userId: string): Promise<void> {
		for (const request of this.requests.values()) {
			if (request.userId === userId && !inactiveStatuses.has(request.status)) {
				await this.update(request.id, {
					status: 'RESET_USED',
					resetToken: undefined,
					resetTokenExpiresAt: undefined,
				});
			}
		}
	}

	async update(
		id: string,
		requestData: Partial<
			Omit<PasswordRecoveryRequest, 'id' | 'createdAt' | 'updatedAt'>
		>,
	): Promise<PasswordRecoveryRequest | null> {
		const existing = this.requests.get(id);
		if (!existing) {
			return null;
		}

		const updated: PasswordRecoveryRequest = {
			...existing,
			...requestData,
			updatedAt: new Date(),
		};
		this.requests.set(id, updated);
		return updated;
	}
}
