import type { Onboarding } from '../entities/onboarding';

export interface OnboardingRepository {
	create(
		onboarding: Omit<Onboarding, 'id' | 'createdAt' | 'updatedAt'>,
	): Promise<Onboarding>;
	findByUserId(userId: string): Promise<Onboarding | null>;
	update(
		id: string,
		onboarding: Partial<Omit<Onboarding, 'id' | 'createdAt' | 'updatedAt'>>,
	): Promise<Onboarding | null>;
}
