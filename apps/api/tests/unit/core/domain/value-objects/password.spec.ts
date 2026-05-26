import { describe, expect, it } from 'vitest';
import {
	Password,
	type PasswordHasher,
} from '../../../../../src/core/domain/value-objects/password';

const fakeHasher: PasswordHasher = {
	async hash(plain: string): Promise<string> {
		return `hashed:${plain}`;
	},
	async compare(plain: string, hash: string): Promise<boolean> {
		return hash === `hashed:${plain}`;
	},
};

describe('Password value object', () => {
	it('should create a Password from a valid hash', () => {
		const password = Password.fromHash('hashed:secret');

		expect(password.hash).toBe('hashed:secret');
	});

	it('should throw when creating from an empty hash', () => {
		expect(() => Password.fromHash('')).toThrowError(
			'Password hash must not be empty',
		);
	});

	it('should hash a valid plain password using the hasher', async () => {
		const password = await Password.fromPlain('super-secret', fakeHasher);

		expect(password.hash).toBe('hashed:super-secret');
	});

	it('should reject passwords shorter than 8 characters', async () => {
		await expect(Password.fromPlain('short', fakeHasher)).rejects.toThrowError(
			'Password must have at least 8 characters',
		);
	});

	it('should verify a correct plain password against the stored hash', async () => {
		const password = await Password.fromPlain('super-secret', fakeHasher);

		await expect(password.verify('super-secret', fakeHasher)).resolves.toBe(
			true,
		);
	});

	it('should fail verification for an incorrect plain password', async () => {
		const password = await Password.fromPlain('super-secret', fakeHasher);

		await expect(password.verify('other-password', fakeHasher)).resolves.toBe(
			false,
		);
	});
});
