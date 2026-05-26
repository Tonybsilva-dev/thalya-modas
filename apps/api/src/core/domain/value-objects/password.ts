export interface PasswordHasher {
	hash(plain: string): Promise<string>;
	compare(plain: string, hash: string): Promise<boolean>;
}

export class Password {
	private constructor(private readonly value: string) {}

	static fromHash(hash: string): Password {
		if (!hash.trim()) {
			throw new Error('Password hash must not be empty');
		}

		return new Password(hash);
	}

	static async fromPlain(
		plain: string,
		hasher: PasswordHasher,
	): Promise<Password> {
		if (plain.length < 8) {
			throw new Error('Password must have at least 8 characters');
		}

		const hash = await hasher.hash(plain);
		return new Password(hash);
	}

	get hash(): string {
		return this.value;
	}

	async verify(plain: string, hasher: PasswordHasher): Promise<boolean> {
		return hasher.compare(plain, this.value);
	}
}
