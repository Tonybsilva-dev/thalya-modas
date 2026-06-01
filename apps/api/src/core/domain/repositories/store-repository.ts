import type { Store } from '../entities/store';

export interface StoreRepository {
	create(store: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>): Promise<Store>;
	findByDocument(document: string): Promise<Store | null>;
	findById(id: string): Promise<Store | null>;
	findByOwnerId(ownerId: string): Promise<Store | null>;
	update(
		id: string,
		store: Partial<Omit<Store, 'id' | 'createdAt' | 'updatedAt'>>,
	): Promise<Store | null>;
}
