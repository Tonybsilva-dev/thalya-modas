import type { Store } from '../entities/store';

export interface StoreAccess {
	role: string;
	store: Store;
}

export type CreateStoreData = Omit<Store, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateStoreData = Partial<
	Omit<
		Store,
		'id' | 'ownerId' | 'slug' | 'bucketKey' | 'createdAt' | 'updatedAt'
	>
>;

export interface StoreRepository {
	create(store: CreateStoreData): Promise<Store>;
	findByDocument(document: string): Promise<Store | null>;
	findById(id: string): Promise<Store | null>;
	findByOwnerId(ownerId: string): Promise<Store | null>;
	findBySlug(slug: string): Promise<Store | null>;
	findAccessibleByUserId(userId: string): Promise<StoreAccess[]>;
	update(id: string, store: UpdateStoreData): Promise<Store | null>;
}
