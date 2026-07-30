const maxStoreSlugLength = 63;

export function normalizeStoreSlug(value: string): string {
	const slug = value
		.normalize('NFKD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, maxStoreSlugLength)
		.replace(/-+$/g, '');

	return slug || 'store';
}

export function appendStoreSlugSuffix(slug: string, suffix: number): string {
	const serializedSuffix = `-${suffix}`;
	const base = slug
		.slice(0, maxStoreSlugLength - serializedSuffix.length)
		.replace(/-+$/g, '');

	return `${base}${serializedSuffix}`;
}

export function createStoreBucketKey(slug: string): string {
	return `stores/${slug}`;
}
