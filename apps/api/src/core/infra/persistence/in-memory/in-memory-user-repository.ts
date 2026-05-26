import { createPage } from '../../../../shared/pagination';
import type { User } from '../../../domain/entities/user';
import type {
	FindManyUsersParams,
	FindManyUsersResult,
	UserRepository,
} from '../../../domain/repositories/user-repository';

export class InMemoryUserRepository implements UserRepository {
	private users: Map<string, User> = new Map();

	async findById(id: string): Promise<User | null> {
		return this.users.get(id) ?? null;
	}

	async findByEmail(email: string): Promise<User | null> {
		for (const user of this.users.values()) {
			if (user.email === email) {
				return user;
			}
		}
		return null;
	}

	async findMany(params: FindManyUsersParams): Promise<FindManyUsersResult> {
		let data = Array.from(this.users.values());
		if (params.filter?.trim()) {
			const f = params.filter.trim().toLowerCase();
			data = data.filter(
				(u) =>
					u.name.toLowerCase().includes(f) || u.email.toLowerCase().includes(f),
			);
		}
		const total = data.length;
		const order = params.sort?.toLowerCase() === 'desc' ? -1 : 1;
		data = [...data].sort(
			(a, b) => order * (a.createdAt.getTime() - b.createdAt.getTime()),
		);
		const start = (params.page - 1) * params.perPage;
		data = data.slice(start, start + params.perPage);

		return createPage(data, total, params);
	}

	async count(filter?: string): Promise<number> {
		let data = Array.from(this.users.values());
		if (filter?.trim()) {
			const f = filter.trim().toLowerCase();
			data = data.filter(
				(u) =>
					u.name.toLowerCase().includes(f) || u.email.toLowerCase().includes(f),
			);
		}
		return data.length;
	}

	async create(
		userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
	): Promise<User> {
		const now = new Date();
		const user: User = {
			...userData,
			id: crypto.randomUUID(),
			createdAt: now,
			updatedAt: now,
		};
		this.users.set(user.id, user);
		return user;
	}

	async update(
		id: string,
		userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>,
	): Promise<User | null> {
		const existing = this.users.get(id);
		if (!existing) {
			return null;
		}
		const updated: User = {
			...existing,
			...userData,
			updatedAt: new Date(),
		};
		this.users.set(id, updated);
		return updated;
	}

	async delete(id: string): Promise<boolean> {
		return this.users.delete(id);
	}
}
