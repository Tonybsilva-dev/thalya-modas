import type { Page } from '../../../shared/pagination/page';
import type { PageRequest } from '../../../shared/pagination/page-request';
import type { User } from '../entities/user';

export type FindManyUsersParams = PageRequest;

export type FindManyUsersResult = Page<User>;

export interface UserRepository {
	findById(id: string): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;
	findMany(params: FindManyUsersParams): Promise<FindManyUsersResult>;
	count(filter?: string): Promise<number>;
	create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
	update(
		id: string,
		user: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>,
	): Promise<User | null>;
	delete(id: string): Promise<boolean>;
}
