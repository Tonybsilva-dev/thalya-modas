const MIN_LENGTH = 2;

export class Name {
	private constructor(private readonly _value: string) {}

	static fromRaw(raw: string): Name {
		const stripped = raw.replace(/[^\p{L}\p{N}\s\-']/gu, '');
		const collapsed = stripped.replace(/\s+/g, ' ').trim();
		if (collapsed.length < MIN_LENGTH) {
			throw new Error(
				`Nome deve ter pelo menos ${MIN_LENGTH} caracteres após normalização`,
			);
		}
		return new Name(collapsed);
	}

	get value(): string {
		return this._value;
	}
}
