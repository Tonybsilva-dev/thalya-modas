import type { Onboarding } from '../../../domain/entities/onboarding';
import type { OnboardingRepository } from '../../../domain/repositories/onboarding-repository';

export class InMemoryOnboardingRepository implements OnboardingRepository {
	private onboardings: Map<string, Onboarding> = new Map();

	async create(
		onboardingData: Omit<Onboarding, 'id' | 'createdAt' | 'updatedAt'>,
	): Promise<Onboarding> {
		const now = new Date();
		const onboarding: Onboarding = {
			...onboardingData,
			id: crypto.randomUUID(),
			createdAt: now,
			updatedAt: now,
		};
		this.onboardings.set(onboarding.id, onboarding);
		return onboarding;
	}

	async findByUserId(userId: string): Promise<Onboarding | null> {
		for (const onboarding of this.onboardings.values()) {
			if (onboarding.userId === userId) {
				return onboarding;
			}
		}

		return null;
	}

	async update(
		id: string,
		onboardingData: Partial<Omit<Onboarding, 'id' | 'createdAt' | 'updatedAt'>>,
	): Promise<Onboarding | null> {
		const existing = this.onboardings.get(id);
		if (!existing) {
			return null;
		}

		const updated: Onboarding = {
			...existing,
			...onboardingData,
			updatedAt: new Date(),
		};
		this.onboardings.set(id, updated);
		return updated;
	}
}
