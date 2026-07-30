import { Prisma, type PrismaClient } from '@prisma/client';
import type {
	Store,
	StoreAddress,
	StorePreferences,
	StoreSegment,
	StoreStatus,
} from '../../../domain/entities/store';
import type {
	StoreAccess,
	StoreRepository,
} from '../../../domain/repositories/store-repository';

const ownerMembershipRole = 'OWNER';
const activeMembershipStatus = 'ACTIVE';

export class PrismaStoreRepository implements StoreRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async create(
		store: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>,
	): Promise<Store> {
		const created = await this.prisma.store.create({
			data: {
				ownerId: store.ownerId,
				name: store.name,
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

	async findAccessibleByUserId(userId: string): Promise<StoreAccess[]> {
		const stores = await this.prisma.store.findMany({
			include: {
				memberships: {
					select: { role: true },
					where: {
						status: activeMembershipStatus,
						userId,
					},
				},
			},
			orderBy: { createdAt: 'asc' },
			where: {
				OR: [
					{ ownerId: userId },
					{
						memberships: {
							some: {
								status: activeMembershipStatus,
								userId,
							},
						},
					},
				],
			},
		});

		return stores.map((store) => ({
			role:
				store.ownerId === userId
					? ownerMembershipRole
					: (store.memberships[0]?.role ?? 'MEMBER'),
			store: toDomainStore(store),
		}));
	}

	async update(
		id: string,
		store: Partial<Omit<Store, 'id' | 'createdAt' | 'updatedAt'>>,
	): Promise<Store | null> {
		const existing = await this.prisma.store.findUnique({ where: { id } });
		if (!existing) {
			return null;
		}

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
	id: string;
	ownerId: string;
	name: string;
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
		ownerId: store.ownerId,
		name: store.name,
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
