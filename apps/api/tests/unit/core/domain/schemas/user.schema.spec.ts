import { describe, expect, it } from 'vitest';
import {
	AccountStatus,
	UserRole,
} from '../../../../../src/core/domain/entities/user';
import {
	createUserSchema,
	updateUserSchema,
	userSchema,
} from '../../../../../src/core/domain/schemas/user.schema';

describe('userSchema', () => {
	it('should validate a valid user object', () => {
		const now = new Date();

		const result = userSchema.safeParse({
			id: '1e02e2b8-8ab8-4aa0-9a46-3c2b0bbf5b1b',
			name: 'John Doe',
			email: 'john@example.com',
			passwordHash: 'hashed:super-secret',
			role: UserRole.CUSTOMER,
			accountStatus: AccountStatus.ACTIVE,
			createdAt: now,
			updatedAt: now,
		});

		expect(result.success).toBe(true);
	});

	it('should reject invalid email', () => {
		const now = new Date();

		const result = userSchema.safeParse({
			id: '1e02e2b8-8ab8-4aa0-9a46-3c2b0bbf5b1b',
			name: 'John Doe',
			email: 'not-an-email',
			passwordHash: 'hashed:super-secret',
			role: UserRole.CUSTOMER,
			accountStatus: AccountStatus.ACTIVE,
			createdAt: now,
			updatedAt: now,
		});

		expect(result.success).toBe(false);
	});

	it('should reject invalid role', () => {
		const now = new Date();

		// @ts-expect-error testing runtime validation
		const result = userSchema.safeParse({
			id: '1e02e2b8-8ab8-4aa0-9a46-3c2b0bbf5b1b',
			name: 'John Doe',
			email: 'john@example.com',
			passwordHash: 'hashed:super-secret',
			role: 'ROLE_MANAGER',
			accountStatus: AccountStatus.ACTIVE,
			createdAt: now,
			updatedAt: now,
		});

		expect(result.success).toBe(false);
	});

	it('should reject invalid accountStatus', () => {
		const now = new Date();

		// @ts-expect-error testing runtime validation
		const result = userSchema.safeParse({
			id: '1e02e2b8-8ab8-4aa0-9a46-3c2b0bbf5b1b',
			name: 'John Doe',
			email: 'john@example.com',
			passwordHash: 'hashed:super-secret',
			role: UserRole.CUSTOMER,
			accountStatus: 'INVALID_STATUS',
			createdAt: now,
			updatedAt: now,
		});

		expect(result.success).toBe(false);
	});
});

describe('createUserSchema', () => {
	it('should require password and omit system fields', () => {
		const result = createUserSchema.safeParse({
			name: 'John Doe',
			email: 'john@example.com',
			password: 'super-secret',
			role: UserRole.CUSTOMER,
		});

		expect(result.success).toBe(true);
	});

	it('should fail when password is missing', () => {
		const result = createUserSchema.safeParse({
			name: 'John Doe',
			email: 'john@example.com',
		});

		expect(result.success).toBe(false);
	});
});

describe('updateUserSchema', () => {
	it('should accept a partial payload', () => {
		const result = updateUserSchema.safeParse({
			name: 'Updated Name',
		});

		expect(result.success).toBe(true);
	});

	it('should still validate field formats on partial payload', () => {
		const result = updateUserSchema.safeParse({
			email: 'not-an-email',
		});

		expect(result.success).toBe(false);
	});
});
