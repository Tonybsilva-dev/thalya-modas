import { describe, expect, it } from 'vitest';
import {
	appendStoreSlugSuffix,
	createStoreBucketKey,
	normalizeStoreSlug,
} from '../../../../../src/core/domain/value-objects/store-slug';

describe('Store storage identity', () => {
	it('deve normalizar o nome da loja para um slug seguro', () => {
		expect(normalizeStoreSlug('  Thálya Modas & Acessórios  ')).toBe(
			'thalya-modas-acessorios',
		);
	});

	it('deve usar fallback quando o nome não contém caracteres válidos', () => {
		expect(normalizeStoreSlug('🛍️✨')).toBe('store');
	});

	it('deve limitar slugs e preservar espaço para sufixos de unicidade', () => {
		const baseSlug = normalizeStoreSlug('a'.repeat(100));
		const suffixedSlug = appendStoreSlugSuffix(baseSlug, 123);

		expect(baseSlug).toHaveLength(63);
		expect(suffixedSlug).toHaveLength(63);
		expect(suffixedSlug).toMatch(/-123$/);
	});

	it('deve criar o prefixo oficial do tenant no bucket', () => {
		expect(createStoreBucketKey('thalya-modas')).toBe('stores/thalya-modas');
	});
});
