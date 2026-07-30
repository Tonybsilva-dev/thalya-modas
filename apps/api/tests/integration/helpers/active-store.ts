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

	return storeRepository.create({
		bucketKey: createStoreBucketKey(slug),
		document: `test-${randomUUID()}`,
		name,
		ownerId,
		phone: '85999990000',
		segment: StoreSegment.FASHION,
		slug,
		status: StoreStatus.ACTIVE,
	});
}
