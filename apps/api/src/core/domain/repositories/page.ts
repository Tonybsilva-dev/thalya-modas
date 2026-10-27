export type PageQuery = {
	page: number;
	perPage: number;
	filter?: string;
	status?: string;
	userId?: string;
	tenantId?: string;
};
export type Page<T> = {
	items: T[];
	total: number;
	page: number;
	perPage: number;
	totalPages: number;
};
export function pageResult<T>(
	items: T[],
	total: number,
	query: PageQuery,
): Page<T> {
	return {
		items,
		total,
		page: query.page,
		perPage: query.perPage,
		totalPages: Math.ceil(total / query.perPage),
	};
}
export function memoryPage<
	T extends { id: string; name: string; status?: string; createdAt: Date },
>(rows: T[], query: PageQuery): Page<T> {
	const filtered = rows
		.filter(
			(row) =>
				(!query.filter ||
					row.name
						.toLocaleLowerCase()
						.includes(query.filter.toLocaleLowerCase())) &&
				(!query.status || row.status === query.status),
		)
		.sort(
			(a, b) =>
				b.createdAt.getTime() - a.createdAt.getTime() ||
				b.id.localeCompare(a.id),
		);
	return pageResult(
		filtered.slice(
			(query.page - 1) * query.perPage,
			query.page * query.perPage,
		),
		filtered.length,
		query,
	);
}
