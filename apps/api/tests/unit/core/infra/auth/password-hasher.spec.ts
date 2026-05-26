import { describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from '../../../../../src/core/infra/auth/password-hasher';

describe('BcryptPasswordHasher', () => {
	const hasher = new BcryptPasswordHasher();

	describe('hash', () => {
		it('deve gerar hash de uma senha válida', async () => {
			const plainPassword = 'mySecurePassword123';
			const hash = await hasher.hash(plainPassword);

			expect(hash).toBeDefined();
			expect(hash).not.toBe(plainPassword);
			expect(hash.length).toBeGreaterThan(20); // bcrypt hash tem ~60 caracteres
			expect(hash).toMatch(/^\$2[aby]\$/); // Formato bcrypt
		});

		it('deve gerar hashes diferentes para a mesma senha (salt único)', async () => {
			const plainPassword = 'samePassword';
			const hash1 = await hasher.hash(plainPassword);
			const hash2 = await hasher.hash(plainPassword);

			expect(hash1).not.toBe(hash2);
		});

		it('deve lançar erro para senha vazia', async () => {
			await expect(hasher.hash('')).rejects.toThrow(
				'Password must not be empty',
			);
		});

		it('deve lançar erro para senha com apenas espaços', async () => {
			await expect(hasher.hash('   ')).rejects.toThrow(
				'Password must not be empty',
			);
		});
	});

	describe('compare', () => {
		it('deve retornar true para senha correta', async () => {
			const plainPassword = 'mySecurePassword123';
			const hash = await hasher.hash(plainPassword);

			const result = await hasher.compare(plainPassword, hash);
			expect(result).toBe(true);
		});

		it('deve retornar false para senha incorreta', async () => {
			const plainPassword = 'mySecurePassword123';
			const wrongPassword = 'wrongPassword';
			const hash = await hasher.hash(plainPassword);

			const result = await hasher.compare(wrongPassword, hash);
			expect(result).toBe(false);
		});

		it('deve retornar false para senha vazia', async () => {
			const hash = await hasher.hash('somePassword');
			const result = await hasher.compare('', hash);
			expect(result).toBe(false);
		});

		it('deve retornar false para hash vazio', async () => {
			const result = await hasher.compare('somePassword', '');
			expect(result).toBe(false);
		});

		it('deve retornar false para hash inválido', async () => {
			const result = await hasher.compare('somePassword', 'invalidHash');
			expect(result).toBe(false);
		});
	});
});
