import {
	OnboardingStatus,
	OnboardingStep,
} from '../../../src/core/domain/entities/onboarding';
import type { OnboardingRepository } from '../../../src/core/domain/repositories/onboarding-repository';

const onboardings = new WeakMap<StoreRepository, OnboardingRepository>();
export function bindTestOnboarding(
	stores: StoreRepository,
	repository: OnboardingRepository,
) {
	onboardings.set(stores, repository);
}

import { randomUUID } from 'node:crypto';
import {
	StoreSegment,
	StoreStatus,
} from '../../../src/core/domain/entities/store';
import type { StoreRepository } from '../../../src/core/domain/repositories/store-repository';
import {
	createStoreBucketKey,
	normalizeStoreSlug,
} from '../../../src/core/domain/value-objects/store-slug';

export async function createActiveTestStore(
	storeRepository: StoreRepository,
	ownerId: string,
	name = 'Loja de teste',
) {
	const slug = normalizeStoreSlug(`${name}-${randomUUID()}`);

	const store = await storeRepository.create({
		bucketKey: createStoreBucketKey(slug),
		document: `test-${randomUUID()}`,
		name,
		ownerId,
		phone: '85999990000',
		segment: StoreSegment.FASHION,
		slug,
		status: StoreStatus.ACTIVE,
	});
	const repository = onboardings.get(storeRepository);
	const onboarding = await repository?.findByUserId(ownerId);
	if (repository && onboarding)
		await repository.update(onboarding.id, {
			storeId: store.id,
			status: OnboardingStatus.COMPLETED,
			nextStep: OnboardingStep.COMPLETED,
			completedSteps: Object.values(OnboardingStep),
		});
	return store;
}
