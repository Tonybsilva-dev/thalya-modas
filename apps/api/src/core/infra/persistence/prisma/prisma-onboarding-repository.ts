import type { PrismaClient } from '@prisma/client';
import type {
	Onboarding,
	OnboardingStatus,
	OnboardingStep,
} from '../../../domain/entities/onboarding';
import type { OnboardingRepository } from '../../../domain/repositories/onboarding-repository';

export class PrismaOnboardingRepository implements OnboardingRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async create(
		onboarding: Omit<Onboarding, 'id' | 'createdAt' | 'updatedAt'>,
	): Promise<Onboarding> {
		const created = await this.prisma.onboarding.create({
			data: {
				userId: onboarding.userId,
				storeId: onboarding.storeId,
				status: onboarding.status,
				nextStep: onboarding.nextStep,
				completedSteps: onboarding.completedSteps,
			},
		});

		return toDomainOnboarding(created);
	}

	async findByUserId(userId: string): Promise<Onboarding | null> {
		const onboarding = await this.prisma.onboarding.findUnique({
			where: { userId },
		});

		return onboarding ? toDomainOnboarding(onboarding) : null;
	}

	async update(
		id: string,
		onboarding: Partial<Omit<Onboarding, 'id' | 'createdAt' | 'updatedAt'>>,
	): Promise<Onboarding | null> {
		const existing = await this.prisma.onboarding.findUnique({ where: { id } });
		if (!existing) {
			return null;
		}

		const updated = await this.prisma.onboarding.update({
			where: { id },
			data: onboarding,
		});

		return toDomainOnboarding(updated);
	}
}

function toDomainOnboarding(onboarding: {
	id: string;
	userId: string;
	storeId: string | null;
	status: string;
	nextStep: string;
	completedSteps: string[];
	createdAt: Date;
	updatedAt: Date;
}): Onboarding {
	return {
		id: onboarding.id,
		userId: onboarding.userId,
		storeId: onboarding.storeId ?? undefined,
		status: onboarding.status as OnboardingStatus,
		nextStep: onboarding.nextStep as OnboardingStep,
		completedSteps: onboarding.completedSteps as OnboardingStep[],
		createdAt: onboarding.createdAt,
		updatedAt: onboarding.updatedAt,
	};
}
