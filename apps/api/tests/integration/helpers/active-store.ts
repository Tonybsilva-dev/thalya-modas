import { randomUUID } from 'node:crypto';
import {
	StoreSegment,
	StoreStatus,
} from '../../../src/core/domain/entities/store';
import type { StoreRepository } from '../../../src/core/domain/repositories/store-repository';

export async function createActiveTestStore(
	storeRepository: StoreRepository,
	ownerId: string,
	name = 'Loja de teste',
) {
	return storeRepository.create({
		document: `test-${randomUUID()}`,
		name,
		ownerId,
		phone: '85999990000',
		segment: StoreSegment.FASHION,
		status: StoreStatus.ACTIVE,
	});
}
