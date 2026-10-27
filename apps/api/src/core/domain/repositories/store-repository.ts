import type { Store } from '../entities/store';
import type { Tenant } from '../entities/tenant';
import type { Page, PageQuery } from './page';
import type { TenantRepository } from './tenant-repository';

export interface StoreAccess {
	role: string;
	store: Store;
}

export type CreateStoreData = Omit<
	Store,
	'id' | 'tenantId' | 'createdAt' | 'updatedAt'
> & { tenantId?: string };

export type UpdateStoreData = Partial<
	Omit<
		Store,
		| 'id'
		| 'tenantId'
		| 'ownerId'
		| 'slug'
		| 'bucketKey'
		| 'createdAt'
		| 'updatedAt'
	>
>;

export interface StoreRepository extends TenantRepository {
	getPlatformSummary(): Promise<{
		tenants: number;
		activeTenants: number;
		suspendedTenants: number;
		branches: number;
		activeBranches: number;
		tenantsWithoutBranches: number;
	}>;
	findTenantsPage(
		query: PageQuery,
	): Promise<Page<Tenant & { branchCount: number }>>;
	findStoresPage(query: PageQuery): Promise<Page<Store>>;
	findTenantUserIdsPage(
		tenantId: string,
		query: PageQuery,
	): Promise<Page<string>>;
	updateMemberRoles(userId: string, role: string): Promise<void>;
	findAssociatedStoreIds(userId: string): Promise<string[]>;
	findAll(): Promise<Store[]>;
	findUserIds(storeId: string): Promise<string[]>;
	addMember(storeId: string, userId: string, role: string): Promise<void>;
	create(store: CreateStoreData): Promise<Store>;
	findByDocument(document: string): Promise<Store | null>;
	findById(id: string): Promise<Store | null>;
	findByOwnerId(ownerId: string): Promise<Store | null>;
	findBySlug(slug: string): Promise<Store | null>;
	findAccessibleByUserId(userId: string): Promise<StoreAccess[]>;
	update(id: string, store: UpdateStoreData): Promise<Store | null>;
}
