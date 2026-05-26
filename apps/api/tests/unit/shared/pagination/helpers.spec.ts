import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { PAGINATION_DEFAULTS } from '../../../../src/shared/pagination';
import {
	normalizePagination,
	parsePageRequest,
	parsePageRequestSafe,
} from '../../../../src/shared/pagination/helpers';

describe('parsePageRequest', () => {
	it('deve converter query string válida em PageRequest', () => {
		const query = {
			page: '2',
			perPage: '20',
			sort: 'createdAt:desc',
			filter: 'status:active',
		};

		const result = parsePageRequest(query);

		expect(result).toEqual({
			page: 2,
			perPage: 20,
			sort: 'createdAt:desc',
			filter: 'status:active',
		});
	});

	it('deve converter números diretamente', () => {
		const query = {
			page: 3,
			perPage: 15,
		};

		const result = parsePageRequest(query);

		expect(result.page).toBe(3);
		expect(result.perPage).toBe(15);
	});

	it('deve aplicar valores padrão quando campos não são fornecidos', () => {
		const query = {};

		const result = parsePageRequest(query);

		expect(result.page).toBe(PAGINATION_DEFAULTS.PAGE);
		expect(result.perPage).toBe(PAGINATION_DEFAULTS.PER_PAGE);
	});

	it('deve lançar erro para valores inválidos', () => {
		expect(() => {
			parsePageRequest({ page: -1 });
		}).toThrow(ZodError);

		expect(() => {
			parsePageRequest({ perPage: 101 });
		}).toThrow(ZodError);
	});
});

describe('parsePageRequestSafe', () => {
	it('deve retornar PageRequest válido quando query é válida', () => {
		const query = {
			page: '2',
			perPage: '20',
		};

		const result = parsePageRequestSafe(query);

		expect(result).toEqual({
			page: 2,
			perPage: 20,
			sort: undefined,
			filter: undefined,
		});
	});

	it('deve aplicar valores padrão quando query é inválida', () => {
		const query = {
			page: -1,
			perPage: 200,
		};

		const result = parsePageRequestSafe(query);

		expect(result.page).toBe(PAGINATION_DEFAULTS.PAGE);
		expect(result.perPage).toBe(PAGINATION_DEFAULTS.PER_PAGE);
	});

	it('deve preservar sort e filter quando válidos mesmo com page/perPage inválidos', () => {
		const query = {
			page: -1,
			perPage: 200,
			sort: 'name:asc',
			filter: 'active:true',
		};

		const result = parsePageRequestSafe(query);

		expect(result.page).toBe(PAGINATION_DEFAULTS.PAGE);
		expect(result.perPage).toBe(PAGINATION_DEFAULTS.PER_PAGE);
		expect(result.sort).toBe('name:asc');
		expect(result.filter).toBe('active:true');
	});

	it('deve ignorar sort e filter quando não são strings', () => {
		const query = {
			page: -1,
			perPage: 200,
			sort: 123,
			filter: { nested: 'object' },
		};

		const result = parsePageRequestSafe(query);

		expect(result.sort).toBeUndefined();
		expect(result.filter).toBeUndefined();
	});
});

describe('normalizePagination', () => {
	it('deve normalizar valores válidos', () => {
		const result = normalizePagination(2, 20);

		expect(result).toEqual({
			page: 2,
			perPage: 20,
		});
	});

	it('deve normalizar strings para números', () => {
		const result = normalizePagination('3', '15');

		expect(result).toEqual({
			page: 3,
			perPage: 15,
		});
	});

	it('deve aplicar valores padrão quando undefined', () => {
		const result = normalizePagination(undefined, undefined);

		expect(result).toEqual({
			page: PAGINATION_DEFAULTS.PAGE,
			perPage: PAGINATION_DEFAULTS.PER_PAGE,
		});
	});

	it('deve garantir page >= 1', () => {
		const result1 = normalizePagination(0, 10);
		expect(result1.page).toBe(1);

		const result2 = normalizePagination(-5, 10);
		expect(result2.page).toBe(1);

		const result3 = normalizePagination('0', 10);
		expect(result3.page).toBe(1);
	});

	it('deve garantir perPage entre 1 e MAX_PER_PAGE', () => {
		const result1 = normalizePagination(1, 0);
		expect(result1.perPage).toBe(1);

		const result2 = normalizePagination(1, -5);
		expect(result2.perPage).toBe(1);

		const result3 = normalizePagination(1, 200);
		expect(result3.perPage).toBe(PAGINATION_DEFAULTS.MAX_PER_PAGE);

		const result4 = normalizePagination(1, PAGINATION_DEFAULTS.MAX_PER_PAGE);
		expect(result4.perPage).toBe(PAGINATION_DEFAULTS.MAX_PER_PAGE);
	});

	it('deve tratar strings inválidas como padrão', () => {
		const result = normalizePagination('invalid', 'also-invalid');

		expect(result.page).toBe(PAGINATION_DEFAULTS.PAGE);
		expect(result.perPage).toBe(PAGINATION_DEFAULTS.PER_PAGE);
	});
});
