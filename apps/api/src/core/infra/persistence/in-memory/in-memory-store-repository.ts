import { DomainError } from '../../../../app/http/errors/domain-error';
import type { Store } from '../../../domain/entities/store';
import {
	type Tenant,
	type TenantAccess,
	TenantStatus,
} from '../../../domain/entities/tenant';
import {
	memoryPage,
	type PageQuery,
	pageResult,
} from '../../../domain/repositories/page';
import type {
	CreateStoreData,
	StoreAccess,
	StoreRepository,
	UpdateStoreData,
} from '../../../domain/repositories/store-repository';

export class InMemoryStoreRepository implements StoreRepository {
	async getPlatformSummary() {
		const tenants = await this.findAllTenants();
		const branches = await this.findAll();
		return {
			tenants: tenants.length,
			activeTenants: tenants.filter((row) => row.status === 'ACTIVE').length,
			suspendedTenants: tenants.filter((row) => row.status === 'SUSPENDED')
				.length,
			branches: branches.length,
			activeBranches: branches.filter((row) => row.status === 'ACTIVE').length,
			tenantsWithoutBranches: tenants.filter(
				(row) => !branches.some((branch) => branch.tenantId === row.id),
			).length,
		};
	}
	private tenants = new Map<string, Tenant>();
	private tenantMembers: {
		tenantId: string;
		userId: string;
		role: string;
		status: string;
	}[] = [];
	private members: { storeId: string; userId: string; role: string }[] = [];
	private stores: Map<string, Store> = new Map();

	async findTenantsPage(query: PageQuery) {
		const allowed = query.userId
			? (await this.findTenantsByUserId(query.userId)).map((row) => row.tenant)
			: await this.findAllTenants();
		return memoryPage(
			allowed.map((tenant) => ({
				...tenant,
				branchCount: [...this.stores.values()].filter(
					(store) => store.tenantId === tenant.id,
				).length,
			})),
			query,
		);
	}
	async findStoresPage(query: PageQuery) {
		const rows = query.userId
			? (await this.findAccessibleByUserId(query.userId)).map(
					(row) => row.store,
				)
			: await this.findAll();
		return memoryPage(
			rows.filter((row) => !query.tenantId || row.tenantId === query.tenantId),
			query,
		);
	}
	async findTenantUserIdsPage(tenantId: string, query: PageQuery) {
		const ids = (await this.findTenantUserIds(tenantId)).sort();
		return pageResult(
			ids.slice((query.page - 1) * query.perPage, query.page * query.perPage),
			ids.length,
			query,
		);
	}

	async findTenantUserIds(tenantId: string): Promise<string[]> {
		return this.tenantMembers
			.filter((m) => m.tenantId === tenantId)
			.map((m) => m.userId);
	}

	async createTenant(input: {
		name: string;
		ownerId: string;
		slug: string;
	}): Promise<Tenant> {
		if ([...this.tenants.values()].some((t) => t.slug === input.slug))
			throw new DomainError('Empresa ja existente.');
		const t = {
			...input,
			id: crypto.randomUUID(),
			status: TenantStatus.ACTIVE,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		this.tenants.set(t.id, t);
		await this.addTenantMember(t.id, t.ownerId, 'ADMIN');
		return t;
	}
	async findTenantById(id: string): Promise<Tenant | null> {
		return this.tenants.get(id) ?? null;
	}
	async findAllTenants(): Promise<Tenant[]> {
		return [...this.tenants.values()];
	}
	async findTenantsByUserId(userId: string): Promise<TenantAccess[]> {
		return this.tenantMembers
			.filter((m) => m.userId === userId && m.status === 'ACTIVE')
			.map((m) => ({ role: m.role, tenant: this.tenants.get(m.tenantId)! }));
	}
	async findAssociatedTenantIds(userId: string): Promise<string[]> {
		return this.tenantMembers
			.filter((m) => m.userId === userId)
			.map((m) => m.tenantId);
	}
	async updateTenant(
		id: string,
		input: { name?: string; status?: TenantStatus },
	): Promise<Tenant> {
		const existing = this.tenants.get(id);
		if (!existing) throw new DomainError('Empresa inexistente.');
		const t = { ...existing, ...input, updatedAt: new Date() };
		this.tenants.set(id, t);
		return t;
	}
	async addTenantMember(
		tenantId: string,
		userId: string,
		role: string,
	): Promise<void> {
		if (!this.tenants.has(tenantId))
			throw new DomainError('Empresa inexistente.');
		if (
			this.tenantMembers.some(
				(m) => m.tenantId === tenantId && m.userId === userId,
			)
		)
			throw new DomainError('Associacao ja existente.');
		this.tenantMembers.push({ tenantId, userId, role, status: 'ACTIVE' });
	}

	async updateMemberRoles(userId: string, role: string): Promise<void> {
		for (const member of this.tenantMembers)
			if (member.userId === userId)
				member.role = role === 'SUPER_ADMIN' ? 'ADMIN' : role;
		for (const member of this.members)
			if (member.userId === userId) member.role = role;
	}

	async findAll(): Promise<Store[]> {
		return [...this.stores.values()];
	}
	async findAssociatedStoreIds(userId: string): Promise<string[]> {
		return [...this.stores.values()]
			.filter(
				(s) =>
					s.ownerId === userId ||
					this.members.some((m) => m.storeId === s.id && m.userId === userId),
			)
			.map((s) => s.id);
	}

	async findUserIds(storeId: string): Promise<string[]> {
		const store = this.stores.get(storeId);
		return store
			? [
					...new Set([
						store.ownerId,
						...this.members
							.filter((m) => m.storeId === storeId)
							.map((m) => m.userId),
					]),
				]
			: [];
	}
	async addMember(
		storeId: string,
		userId: string,
		role: string,
	): Promise<void> {
		const store = this.stores.get(storeId);
		if (!store) throw new DomainError('Loja inexistente.');
		if (
			!this.tenantMembers.some(
				(m) => m.tenantId === store.tenantId && m.userId === userId,
			)
		)
			await this.addTenantMember(
				store.tenantId,
				userId,
				role === 'CUSTOMER'
					? 'CUSTOMER'
					: role === 'MANAGER'
						? 'MANAGER'
						: 'EMPLOYEE',
			);
		this.members.push({ storeId, userId, role });
	}

	async create(storeData: CreateStoreData): Promise<Store> {
		let tenant = storeData.tenantId
			? await this.findTenantById(storeData.tenantId)
			: [...this.tenants.values()].find(
					(t) => t.slug === `company-${storeData.ownerId}`,
				);
		if (!tenant && !storeData.tenantId)
			tenant = await this.createTenant({
				name: storeData.name,
				ownerId: storeData.ownerId,
				slug: `company-${storeData.ownerId}`,
			});
		if (!tenant || tenant.ownerId !== storeData.ownerId)
			throw new DomainError('Empresa e proprietario da filial inconsistentes.');
		const now = new Date();
		const store: Store = {
			...storeData,
			tenantId: tenant.id,
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
		const accesses = await this.findTenantsByUserId(userId);
		return [...this.stores.values()].flatMap((store) => {
			const tenantAccess = accesses.find((a) => a.tenant.id === store.tenantId);
			if (!tenantAccess) return [];
			const member = this.members.find(
				(m) => m.storeId === store.id && m.userId === userId,
			);
			if (tenantAccess.role !== 'ADMIN' && !member) return [];
			return [
				{
					role:
						tenantAccess.role === 'ADMIN'
							? store.ownerId === userId
								? 'OWNER'
								: 'ADMIN'
							: member!.role,
					store,
				},
			];
		});
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
	if (
		'tenantId' in storeData ||
		'slug' in storeData ||
		'bucketKey' in storeData
	) {
		throw new DomainError('Slug e bucketKey da loja são imutáveis.');
	}
}
