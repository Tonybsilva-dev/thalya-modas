import { z } from 'zod';
import type { Page } from './page';

/**
 * Schema Zod genérico para Page<T>
 * Permite criar schemas de resposta paginada com qualquer tipo de item
 * @param itemSchema - Schema Zod para o tipo de item na página
 * @returns Schema Zod para Page<T>
 */
export function createPageSchema<T extends z.ZodTypeAny>(itemSchema: T) {
	return z.object({
		items: z.array(itemSchema),
		total: z.number().int().nonnegative(),
		page: z.number().int().positive(),
		perPage: z.number().int().positive(),
		totalPages: z.number().int().nonnegative(),
	}) satisfies z.ZodType<Page<z.infer<T>>>;
}
