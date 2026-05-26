import {
	PAGINATION_DEFAULTS,
	type PageRequest,
	pageRequestSchema,
} from './page-request';

/**
 * Converte um objeto de query string em PageRequest validado
 * @param query - Objeto de query string (pode conter strings ou números)
 * @returns PageRequest validado e normalizado
 * @throws {ZodError} Se os valores não passarem na validação
 */
export function parsePageRequest(query: Record<string, unknown>): PageRequest {
	return pageRequestSchema.parse(query);
}

/**
 * Converte um objeto de query string em PageRequest com valores padrão
 * Não lança erro, apenas normaliza valores inválidos para os padrões
 * @param query - Objeto de query string
 * @returns PageRequest com valores padrão aplicados onde necessário
 */
export function parsePageRequestSafe(
	query: Record<string, unknown>,
): PageRequest {
	const result = pageRequestSchema.safeParse(query);

	if (result.success) {
		return result.data;
	}

	// Aplica valores padrão em caso de erro
	return {
		page: PAGINATION_DEFAULTS.PAGE,
		perPage: PAGINATION_DEFAULTS.PER_PAGE,
		sort: typeof query.sort === 'string' ? query.sort : undefined,
		filter: typeof query.filter === 'string' ? query.filter : undefined,
	};
}

/**
 * Valida e normaliza valores de paginação de uma query string
 * Garante que page >= 1 e perPage está entre 1 e MAX_PER_PAGE
 * @param page - Número da página (pode ser string ou number)
 * @param perPage - Itens por página (pode ser string ou number)
 * @returns Objeto com page e perPage normalizados
 */
export function normalizePagination(
	page?: string | number,
	perPage?: string | number,
): { page: number; perPage: number } {
	// Normaliza page: converte string para número ou usa padrão
	let pageNum: number;
	if (typeof page === 'string') {
		const parsed = parseInt(page, 10);
		pageNum = Number.isNaN(parsed) ? PAGINATION_DEFAULTS.PAGE : parsed;
	} else {
		pageNum = page ?? PAGINATION_DEFAULTS.PAGE;
	}
	const normalizedPage = Math.max(1, pageNum);

	// Normaliza perPage: converte string para número ou usa padrão
	let perPageNum: number;
	if (typeof perPage === 'string') {
		const parsed = parseInt(perPage, 10);
		perPageNum = Number.isNaN(parsed) ? PAGINATION_DEFAULTS.PER_PAGE : parsed;
	} else {
		perPageNum = perPage ?? PAGINATION_DEFAULTS.PER_PAGE;
	}
	const normalizedPerPage = Math.min(
		PAGINATION_DEFAULTS.MAX_PER_PAGE,
		Math.max(1, perPageNum),
	);

	return {
		page: normalizedPage,
		perPage: normalizedPerPage,
	};
}
