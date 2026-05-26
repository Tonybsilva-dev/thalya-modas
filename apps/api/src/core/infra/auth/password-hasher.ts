import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '../../domain/value-objects/password';

/**
 * Implementação de PasswordHasher usando bcrypt
 * Fornece hash seguro de senhas com salt automático
 */
export class BcryptPasswordHasher implements PasswordHasher {
	/**
	 * Gera hash de uma senha em texto plano
	 * @param plain - Senha em texto plano
	 * @returns Hash da senha (inclui salt)
	 */
	async hash(plain: string): Promise<string> {
		if (!plain || plain.trim().length === 0) {
			throw new Error('Password must not be empty');
		}

		// bcrypt usa 10 rounds por padrão (balance entre segurança e performance)
		const saltRounds = 10;
		return bcrypt.hash(plain, saltRounds);
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

		return bcrypt.compare(plain, hash);
	}
}
