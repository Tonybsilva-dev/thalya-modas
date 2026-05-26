export function normalizeDigitsOnly(value: string): string {
	return value.replace(/\D/g, '');
}

export function normalizeEmail(value: string): string {
	return value.trim().toLowerCase();
}
