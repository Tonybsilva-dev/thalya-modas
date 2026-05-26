import { describe, expect, it } from 'vitest';
import {
	PAGINATION_DEFAULTS,
	pageRequestSchema,
} from '../../../../src/shared/pagination/page-request';

describe('pageRequestSchema', () => {
	it('deve validar um PageRequest válido', () => {
		const result = pageRequestSchema.parse({
			page: 2,
			perPage: 20,
			sort: 'createdAt:desc',
			filter: 'status:active',
		});

		expect(result).toEqual({
			page: 2,
			perPage: 20,
			sort: 'createdAt:desc',
			filter: 'status:active',
		});
	});

	it('deve aplicar valores padrão quando campos não são fornecidos', () => {
		const result = pageRequestSchema.parse({});

		expect(result).toEqual({
			page: PAGINATION_DEFAULTS.PAGE,
			perPage: PAGINATION_DEFAULTS.PER_PAGE,
			sort: undefined,
			filter: undefined,
		});
	});

	it('deve converter strings para números', () => {
		const result = pageRequestSchema.parse({
			page: '3',
			perPage: '15',
		});

		expect(result.page).toBe(3);
		expect(result.perPage).toBe(15);
	});

	it('deve rejeitar page menor que 1', () => {
		expect(() => {
			pageRequestSchema.parse({ page: 0 });
		}).toThrow();

		expect(() => {
			pageRequestSchema.parse({ page: -1 });
		}).toThrow();
	});

	it('deve rejeitar perPage maior que MAX_PER_PAGE', () => {
		expect(() => {
			pageRequestSchema.parse({ perPage: 101 });
		}).toThrow();

		expect(() => {
			pageRequestSchema.parse({
				perPage: PAGINATION_DEFAULTS.MAX_PER_PAGE + 1,
			});
		}).toThrow();
	});

	it('deve rejeitar perPage menor que 1', () => {
		expect(() => {
			pageRequestSchema.parse({ perPage: 0 });
		}).toThrow();

		expect(() => {
			pageRequestSchema.parse({ perPage: -1 });
		}).toThrow();
	});

	it('deve aceitar perPage no limite máximo', () => {
		const result = pageRequestSchema.parse({
			perPage: PAGINATION_DEFAULTS.MAX_PER_PAGE,
		});
		expect(result.perPage).toBe(PAGINATION_DEFAULTS.MAX_PER_PAGE);
	});

	it('deve aceitar sort e filter opcionais', () => {
		const result1 = pageRequestSchema.parse({ page: 1, perPage: 10 });
		expect(result1.sort).toBeUndefined();
		expect(result1.filter).toBeUndefined();

		const result2 = pageRequestSchema.parse({
			page: 1,
			perPage: 10,
			sort: 'name:asc',
			filter: 'active:true',
		});
		expect(result2.sort).toBe('name:asc');
		expect(result2.filter).toBe('active:true');
	});
});
