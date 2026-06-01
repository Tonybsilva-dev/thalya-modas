import type { PrismaClient } from '@prisma/client';
import { createPage } from '../../../../shared/pagination';
import type {
	AccountStatus,
	User,
	UserRole,
} from '../../../domain/entities/user';
import type {
	FindManyUsersParams,
	FindManyUsersResult,
	UserRepository,
} from '../../../domain/repositories/user-repository';

export class PrismaUserRepository implements UserRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async findById(id: string): Promise<User | null> {
		const user = await this.prisma.user.findUnique({ where: { id } });
		return user ? toDomainUser(user) : null;
	}

	async findByEmail(email: string): Promise<User | null> {
		const user = await this.prisma.user.findUnique({ where: { email } });
		return user ? toDomainUser(user) : null;
	}

	async findMany(params: FindManyUsersParams): Promise<FindManyUsersResult> {
		const where = params.filter?.trim()
			? {
					OR: [
						{
							name: {
								contains: params.filter.trim(),
								mode: 'insensitive' as const,
							},
						},
						{
							email: {
								contains: params.filter.trim(),
								mode: 'insensitive' as const,
							},
						},
					],
				}
			: undefined;

		const [data, total] = await Promise.all([
			this.prisma.user.findMany({
				where,
				orderBy: {
					createdAt: params.sort?.toLowerCase() === 'desc' ? 'desc' : 'asc',
				},
				skip: (params.page - 1) * params.perPage,
				take: params.perPage,
			}),
			this.prisma.user.count({ where }),
		]);

		return createPage(data.map(toDomainUser), total, params);
	}

	async count(filter?: string): Promise<number> {
		const where = filter?.trim()
			? {
					OR: [
						{
							name: {
								contains: filter.trim(),
								mode: 'insensitive' as const,
							},
						},
						{
							email: {
								contains: filter.trim(),
								mode: 'insensitive' as const,
							},
						},
					],
				}
			: undefined;

		return this.prisma.user.count({ where });
	}

	async create(
		user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
	): Promise<User> {
		const created = await this.prisma.user.create({
			data: {
				name: user.name,
				email: user.email,
				passwordHash: user.passwordHash,
				role: user.role,
				accountStatus: user.accountStatus,
			},
		});

		return toDomainUser(created);
	}

	async update(
		id: string,
		user: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>,
	): Promise<User | null> {
		const existing = await this.prisma.user.findUnique({ where: { id } });
		if (!existing) {
			return null;
		}

		const updated = await this.prisma.user.update({
			where: { id },
			data: user,
		});

		return toDomainUser(updated);
	}

	async delete(id: string): Promise<boolean> {
		const existing = await this.prisma.user.findUnique({ where: { id } });
		if (!existing) {
			return false;
		}

		await this.prisma.user.delete({ where: { id } });
		return true;
	}
}

function toDomainUser(user: {
	id: string;
	name: string;
	email: string;
	passwordHash: string;
	role: string;
	accountStatus: string;
	createdAt: Date;
	updatedAt: Date;
}): User {
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		passwordHash: user.passwordHash,
		role: user.role as UserRole,
		accountStatus: user.accountStatus as AccountStatus,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	};
}
