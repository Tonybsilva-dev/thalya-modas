import type { PageRequest } from './page-request';

/**
 * Tipo genérico para resposta paginada
 * @template T - Tipo dos itens na página
 */
export interface Page<T> {
	items: T[];
	total: number;
	page: number;
	perPage: number;
	totalPages: number;
}

/**
 * Cria uma resposta paginada a partir de itens e metadados
 * @param items - Array de itens da página atual
 * @param total - Total de itens disponíveis
 * @param pageRequest - Requisição de paginação com page e perPage
 * @returns Objeto Page<T> com metadados calculados
 */
export function createPage<T>(
	items: T[],
	total: number,
	pageRequest: Pick<PageRequest, 'page' | 'perPage'>,
): Page<T> {
	const { page, perPage } = pageRequest;
	const totalPages = Math.ceil(total / perPage);

	return {
		items,
		total,
		page,
		perPage,
		totalPages,
	};
}
