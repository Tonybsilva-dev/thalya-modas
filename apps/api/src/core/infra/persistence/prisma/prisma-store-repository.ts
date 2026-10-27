import { Prisma, type PrismaClient } from '@prisma/client';
import { DomainError } from '../../../../app/http/errors/domain-error';
import type {
	Store,
	StoreAddress,
	StorePreferences,
	StoreSegment,
	StoreStatus,
} from '../../../domain/entities/store';
import type {
	Tenant,
	TenantAccess,
	TenantStatus,
} from '../../../domain/entities/tenant';
import { type PageQuery, pageResult } from '../../../domain/repositories/page';
import type {
	CreateStoreData,
	StoreAccess,
	StoreRepository,
	UpdateStoreData,
} from '../../../domain/repositories/store-repository';

const ownerMembershipRole = 'OWNER';
const activeMembershipStatus = 'ACTIVE';

export class PrismaStoreRepository implements StoreRepository {
	async getPlatformSummary() {
		const [
			tenants,
			activeTenants,
			suspendedTenants,
			branches,
			activeBranches,
			tenantsWithoutBranches,
		] = await this.prisma.$transaction([
			this.prisma.tenant.count(),
			this.prisma.tenant.count({ where: { status: 'ACTIVE' } }),
			this.prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
			this.prisma.store.count(),
			this.prisma.store.count({ where: { status: 'ACTIVE' } }),
			this.prisma.tenant.count({ where: { stores: { none: {} } } }),
		]);
		return {
			tenants,
			activeTenants,
			suspendedTenants,
			branches,
			activeBranches,
			tenantsWithoutBranches,
		};
	}
	constructor(
		private readonly prisma: PrismaClient,
		private readonly inTransaction = false,
	) {}

	async findTenantsPage(query: PageQuery) {
		const where: Prisma.TenantWhereInput = {
			name: query.filter
				? { contains: query.filter, mode: 'insensitive' }
				: undefined,
			status: query.status,
			memberships: query.userId
				? { some: { userId: query.userId, status: 'ACTIVE' } }
				: undefined,
		};
		const [rows, total] = await this.prisma.$transaction([
			this.prisma.tenant.findMany({
				where,
				include: { _count: { select: { stores: true } } },
				orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
				skip: (query.page - 1) * query.perPage,
				take: query.perPage,
			}),
			this.prisma.tenant.count({ where }),
		]);
		return pageResult(
			rows.map((row) => ({
				...toDomainTenant(row),
				branchCount: row._count.stores,
			})),
			total,
			query,
		);
	}
	async findStoresPage(query: PageQuery) {
		const where: Prisma.StoreWhereInput = {
			tenantId: query.tenantId,
			name: query.filter
				? { contains: query.filter, mode: 'insensitive' }
				: undefined,
			status: query.status,
			OR: query.userId
				? [
						{ ownerId: query.userId },
						{
							memberships: { some: { userId: query.userId, status: 'ACTIVE' } },
						},
					]
				: undefined,
		};
		const [rows, total] = await this.prisma.$transaction([
			this.prisma.store.findMany({
				where,
				orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
				skip: (query.page - 1) * query.perPage,
				take: query.perPage,
			}),
			this.prisma.store.count({ where }),
		]);
		return pageResult(rows.map(toDomainStore), total, query);
	}
	async findTenantUserIdsPage(tenantId: string, query: PageQuery) {
		const where = { tenantId };
		const [rows, total] = await this.prisma.$transaction([
			this.prisma.tenantMembership.findMany({
				where,
				select: { userId: true },
				orderBy: { userId: 'asc' },
				skip: (query.page - 1) * query.perPage,
				take: query.perPage,
			}),
			this.prisma.tenantMembership.count({ where }),
		]);
		return pageResult(
			rows.map((row) => row.userId),
			total,
			query,
		);
	}

	async findTenantUserIds(tenantId: string): Promise<string[]> {
		return (
			await this.prisma.tenantMembership.findMany({
				where: { tenantId },
				select: { userId: true },
			})
		).map((m) => m.userId);
	}

	async createTenant(input: {
		name: string;
		ownerId: string;
		slug: string;
	}): Promise<Tenant> {
		return toDomainTenant(
			await this.prisma.tenant.create({
				data: {
					...input,
					memberships: {
						create: { userId: input.ownerId, role: 'ADMIN', status: 'ACTIVE' },
					},
				},
			}),
		);
	}
	async findTenantById(id: string): Promise<Tenant | null> {
		const t = await this.prisma.tenant.findUnique({ where: { id } });
		return t ? toDomainTenant(t) : null;
	}
	async findAllTenants(): Promise<Tenant[]> {
		return (
			await this.prisma.tenant.findMany({ orderBy: { createdAt: 'asc' } })
		).map(toDomainTenant);
	}
	async findTenantsByUserId(userId: string): Promise<TenantAccess[]> {
		const rows = await this.prisma.tenantMembership.findMany({
			where: { userId, status: 'ACTIVE' },
			include: { tenant: true },
		});
		return rows.map((m) => ({
			role: m.role,
			tenant: toDomainTenant(m.tenant),
		}));
	}
	async findAssociatedTenantIds(userId: string): Promise<string[]> {
		return (
			await this.prisma.tenantMembership.findMany({
				where: { userId },
				select: { tenantId: true },
			})
		).map((m) => m.tenantId);
	}
	async updateTenant(
		id: string,
		input: { name?: string; status?: TenantStatus },
	): Promise<Tenant> {
		return toDomainTenant(
			await this.prisma.tenant.update({ where: { id }, data: input }),
		);
	}
	async addTenantMember(
		tenantId: string,
		userId: string,
		role: string,
	): Promise<void> {
		await this.prisma.tenantMembership.create({
			data: { tenantId, userId, role, status: 'ACTIVE' },
		});
	}

	async updateMemberRoles(userId: string, role: string): Promise<void> {
		await this.prisma.tenantMembership.updateMany({
			where: { userId },
			data: { role: role === 'SUPER_ADMIN' ? 'ADMIN' : role },
		});
		await this.prisma.storeMembership.updateMany({
			where: { userId },
			data: { role },
		});
	}

	async findAll(): Promise<Store[]> {
		return (
			await this.prisma.store.findMany({ orderBy: { createdAt: 'asc' } })
		).map(toDomainStore);
	}
	async findAssociatedStoreIds(userId: string): Promise<string[]> {
		return (
			await this.prisma.store.findMany({
				where: {
					OR: [{ ownerId: userId }, { memberships: { some: { userId } } }],
				},
				select: { id: true },
			})
		).map((s) => s.id);
	}

	async findUserIds(storeId: string): Promise<string[]> {
		const store = await this.prisma.store.findUnique({
			where: { id: storeId },
			include: { memberships: true },
		});
		return store
			? [...new Set([store.ownerId, ...store.memberships.map((m) => m.userId)])]
			: [];
	}
	async addMember(
		storeId: string,
		userId: string,
		role: string,
	): Promise<void> {
		await this.prisma.storeMembership.create({
			data: { storeId, userId, role, status: 'ACTIVE' },
		});
	}

	async create(store: CreateStoreData): Promise<Store> {
		const create = async (transaction: Prisma.TransactionClient) => {
			const tenant = store.tenantId
				? await transaction.tenant.findUnique({ where: { id: store.tenantId } })
				: await transaction.tenant.upsert({
						where: { slug: `company-${store.ownerId}` },
						update: {},
						create: {
							name: store.name,
							slug: `company-${store.ownerId}`,
							ownerId: store.ownerId,
							memberships: {
								create: {
									userId: store.ownerId,
									role: 'ADMIN',
									status: 'ACTIVE',
								},
							},
						},
					});
			if (!tenant || tenant.ownerId !== store.ownerId)
				throw new DomainError(
					'Empresa e proprietario da filial inconsistentes.',
				);
			return transaction.store.create({
				data: {
					tenantId: tenant.id,
					bucketKey: store.bucketKey,
					ownerId: store.ownerId,
					name: store.name,
					slug: store.slug,
					phone: store.phone,
					document: store.document,
					segment: store.segment,
					address: toOptionalJsonInput(store.address),
					memberships: {
						create: {
							role: ownerMembershipRole,
							status: activeMembershipStatus,
							userId: store.ownerId,
						},
					},
					preferences: toOptionalJsonInput(store.preferences),
					status: store.status,
				},
			});
		};
		const created = this.inTransaction
			? await create(this.prisma)
			: await this.prisma.$transaction(create);
		return toDomainStore(created);
	}

	async findByDocument(document: string): Promise<Store | null> {
		const store = await this.prisma.store.findUnique({ where: { document } });
		return store ? toDomainStore(store) : null;
	}

	async findById(id: string): Promise<Store | null> {
		const store = await this.prisma.store.findUnique({ where: { id } });
		return store ? toDomainStore(store) : null;
	}

	async findByOwnerId(ownerId: string): Promise<Store | null> {
		const store = await this.prisma.store.findFirst({ where: { ownerId } });
		return store ? toDomainStore(store) : null;
	}

	async findBySlug(slug: string): Promise<Store | null> {
		const store = await this.prisma.store.findUnique({ where: { slug } });
		return store ? toDomainStore(store) : null;
	}

	async findAccessibleByUserId(userId: string): Promise<StoreAccess[]> {
		const stores = await this.prisma.store.findMany({
			where: {
				tenant: { memberships: { some: { userId, status: 'ACTIVE' } } },
				OR: [
					{
						tenant: {
							memberships: {
								some: { userId, status: 'ACTIVE', role: 'ADMIN' },
							},
						},
					},
					{ memberships: { some: { userId, status: 'ACTIVE' } } },
				],
			},
			include: {
				tenant: {
					include: { memberships: { where: { userId, status: 'ACTIVE' } } },
				},
				memberships: { where: { userId, status: 'ACTIVE' } },
			},
			orderBy: { createdAt: 'asc' },
		});
		return stores.map((store) => ({
			role:
				store.tenant.memberships[0]?.role === 'ADMIN'
					? store.ownerId === userId
						? 'OWNER'
						: 'ADMIN'
					: (store.memberships[0]?.role ?? 'MEMBER'),
			store: toDomainStore(store),
		}));
	}

	async update(id: string, store: UpdateStoreData): Promise<Store | null> {
		const existing = await this.prisma.store.findUnique({ where: { id } });
		if (!existing) {
			return null;
		}
		assertStorageIdentityIsNotBeingChanged(store);

		const data: Prisma.StoreUpdateInput = {};

		if (Object.hasOwn(store, 'name')) data.name = store.name;
		if (Object.hasOwn(store, 'phone')) data.phone = store.phone;
		if (Object.hasOwn(store, 'document')) data.document = store.document;
		if (Object.hasOwn(store, 'segment')) data.segment = store.segment;
		if (Object.hasOwn(store, 'status')) data.status = store.status;
		if (Object.hasOwn(store, 'address')) {
			data.address = toNullableJsonInput(store.address);
		}
		if (Object.hasOwn(store, 'preferences')) {
			data.preferences = toNullableJsonInput(store.preferences);
		}

		const updated = await this.prisma.store.update({
			where: { id },
			data,
		});

		return toDomainStore(updated);
	}
}

function toOptionalJsonInput<T>(
	value: T | undefined,
): Prisma.InputJsonValue | undefined {
	return value === undefined ? undefined : (value as Prisma.InputJsonValue);
}

function toNullableJsonInput<T>(
	value: T | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
	return value === undefined
		? Prisma.JsonNull
		: (value as Prisma.InputJsonValue);
}

function toDomainStore(store: {
	tenantId: string;
	id: string;
	ownerId: string;
	name: string;
	slug: string;
	bucketKey: string;
	phone: string;
	document: string;
	segment: string;
	address: Prisma.JsonValue | null;
	preferences: Prisma.JsonValue | null;
	status: string;
	createdAt: Date;
	updatedAt: Date;
}): Store {
	return {
		id: store.id,
		tenantId: store.tenantId,
		ownerId: store.ownerId,
		name: store.name,
		slug: store.slug,
		bucketKey: store.bucketKey,
		phone: store.phone,
		document: store.document,
		segment: store.segment as StoreSegment,
		address: (store.address ?? undefined) as StoreAddress | undefined,
		preferences: (store.preferences ?? undefined) as
			| StorePreferences
			| undefined,
		status: store.status as StoreStatus,
		createdAt: store.createdAt,
		updatedAt: store.updatedAt,
	};
}

function assertStorageIdentityIsNotBeingChanged(store: object): void {
	if ('tenantId' in store || 'slug' in store || 'bucketKey' in store) {
		throw new DomainError('Slug e bucketKey da loja são imutáveis.');
	}
}

function toDomainTenant(tenant: {
	id: string;
	ownerId: string;
	name: string;
	slug: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
}): Tenant {
	return { ...tenant, status: tenant.status as TenantStatus };
}
