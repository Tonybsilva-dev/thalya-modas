import { describe, expect, it } from 'vitest';
import { createPage } from '../../../../src/shared/pagination/page';
import type { PageRequest } from '../../../../src/shared/pagination/page-request';

describe('createPage', () => {
	it('deve criar uma página com metadados corretos', () => {
		const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
		const total = 25;
		const pageRequest: Pick<PageRequest, 'page' | 'perPage'> = {
			page: 2,
			perPage: 10,
		};

		const page = createPage(items, total, pageRequest);

		expect(page).toEqual({
			items,
			total: 25,
			page: 2,
			perPage: 10,
			totalPages: 3, // Math.ceil(25 / 10) = 3
		});
	});

	it('deve calcular totalPages corretamente para divisão exata', () => {
		const items = [{ id: 1 }, { id: 2 }];
		const total = 10;
		const pageRequest: Pick<PageRequest, 'page' | 'perPage'> = {
			page: 1,
			perPage: 2,
		};

		const page = createPage(items, total, pageRequest);

		expect(page.totalPages).toBe(5); // 10 / 2 = 5
	});

	it('deve calcular totalPages corretamente para divisão com resto', () => {
		const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
		const total = 25;
		const pageRequest: Pick<PageRequest, 'page' | 'perPage'> = {
			page: 1,
			perPage: 10,
		};

		const page = createPage(items, total, pageRequest);

		expect(page.totalPages).toBe(3); // Math.ceil(25 / 10) = 3
	});

	it('deve retornar totalPages = 1 quando total é 0', () => {
		const items: unknown[] = [];
		const total = 0;
		const pageRequest: Pick<PageRequest, 'page' | 'perPage'> = {
			page: 1,
			perPage: 10,
		};

		const page = createPage(items, total, pageRequest);

		expect(page.totalPages).toBe(0); // Math.ceil(0 / 10) = 0
	});

	it('deve funcionar com tipos genéricos', () => {
		interface User {
			id: string;
			name: string;
		}

		const users: User[] = [
			{ id: '1', name: 'John' },
			{ id: '2', name: 'Jane' },
		];
		const total = 50;
		const pageRequest: Pick<PageRequest, 'page' | 'perPage'> = {
			page: 1,
			perPage: 2,
		};

		const page = createPage(users, total, pageRequest);

		expect(page.items).toEqual(users);
		expect(page.items[0].name).toBe('John');
		expect(page.totalPages).toBe(25);
	});
});
