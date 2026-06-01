import argon2 from 'argon2';
import type { PasswordHasher } from '../../domain/value-objects/password';

/**
 * Implementação de PasswordHasher usando Argon2id
 * Fornece hash seguro de senhas com salt automático
 */
export class Argon2PasswordHasher implements PasswordHasher {
	/**
	 * Gera hash de uma senha em texto plano
	 * @param plain - Senha em texto plano
	 * @returns Hash da senha (inclui salt)
	 */
	async hash(plain: string): Promise<string> {
		if (!plain || plain.trim().length === 0) {
			throw new Error('Password must not be empty');
		}

		return argon2.hash(plain, {
			type: argon2.argon2id,
			memoryCost: 19_456,
			timeCost: 2,
			parallelism: 1,
		});
	}

	/**
	 * Compara uma senha em texto plano com um hash
	 * @param plain - Senha em texto plano
	 * @param hash - Hash armazenado
	 * @returns true se a senha corresponde ao hash, false caso contrário
	 */
	async compare(plain: string, hash: string): Promise<boolean> {
		if (!plain || plain.trim().length === 0) {
			return false;
		}

		if (!hash || hash.trim().length === 0) {
			return false;
		}

		try {
			return await argon2.verify(hash, plain);
		} catch {
			return false;
		}
	}
}
