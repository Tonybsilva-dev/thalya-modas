import { DomainError } from '../../../../app/http/errors/domain-error';
import type { Store } from '../../../domain/entities/store';
import type {
	CreateStoreData,
	StoreAccess,
	StoreRepository,
	UpdateStoreData,
} from '../../../domain/repositories/store-repository';

export class InMemoryStoreRepository implements StoreRepository {
	private stores: Map<string, Store> = new Map();

	async create(storeData: CreateStoreData): Promise<Store> {
		const now = new Date();
		const store: Store = {
			...storeData,
			id: crypto.randomUUID(),
			createdAt: now,
			updatedAt: now,
		};
		this.stores.set(store.id, store);
		return store;
	}

	async findByDocument(document: string): Promise<Store | null> {
		for (const store of this.stores.values()) {
			if (store.document === document) {
				return store;
			}
		}

		return null;
	}

	async findById(id: string): Promise<Store | null> {
		return this.stores.get(id) ?? null;
	}

	async findByOwnerId(ownerId: string): Promise<Store | null> {
		for (const store of this.stores.values()) {
			if (store.ownerId === ownerId) {
				return store;
			}
		}

		return null;
	}

	async findBySlug(slug: string): Promise<Store | null> {
		for (const store of this.stores.values()) {
			if (store.slug === slug) {
				return store;
			}
		}

		return null;
	}

	async findAccessibleByUserId(userId: string): Promise<StoreAccess[]> {
		return Array.from(this.stores.values())
			.filter((store) => store.ownerId === userId)
			.map((store) => ({ role: 'OWNER', store }));
	}

	async update(id: string, storeData: UpdateStoreData): Promise<Store | null> {
		const existing = this.stores.get(id);
		if (!existing) {
			return null;
		}
		assertStorageIdentityIsNotBeingChanged(storeData);

		const updated: Store = {
			...existing,
			...storeData,
			updatedAt: new Date(),
		};
		this.stores.set(id, updated);
		return updated;
	}
}

function assertStorageIdentityIsNotBeingChanged(storeData: object): void {
	if ('slug' in storeData || 'bucketKey' in storeData) {
		throw new DomainError('Slug e bucketKey da loja são imutáveis.');
	}
}
