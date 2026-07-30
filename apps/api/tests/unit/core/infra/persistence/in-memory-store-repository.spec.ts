import { describe, expect, it } from 'vitest';
import {
	StoreSegment,
	StoreStatus,
} from '../../../../../src/core/domain/entities/store';
import type { UpdateStoreData } from '../../../../../src/core/domain/repositories/store-repository';
import { InMemoryStoreRepository } from '../../../../../src/core/infra/persistence/in-memory/in-memory-store-repository';

describe('InMemoryStoreRepository', () => {
	it.each([
		['slug', { slug: 'novo-slug' }],
		['bucketKey', { bucketKey: 'stores/novo-slug' }],
	])('deve impedir alteração de %s', async (_, forbiddenUpdate) => {
		const repository = new InMemoryStoreRepository();
		const store = await repository.create({
			bucketKey: 'stores/loja-original',
			document: '12345678000199',
			name: 'Loja Original',
			ownerId: 'owner-id',
			phone: '85999990000',
			segment: StoreSegment.FASHION,
			slug: 'loja-original',
			status: StoreStatus.ACTIVE,
		});

		await expect(
			repository.update(
				store.id,
				forbiddenUpdate as unknown as UpdateStoreData,
			),
		).rejects.toThrow('Slug e bucketKey da loja são imutáveis.');

		await expect(repository.findById(store.id)).resolves.toMatchObject({
			bucketKey: 'stores/loja-original',
			slug: 'loja-original',
		});
	});
});
