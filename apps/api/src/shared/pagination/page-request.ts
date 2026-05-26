import { z } from 'zod';

/**
 * Schema Zod para validação de PageRequest
 * Define limites padrão e validações para paginação
 */
export const pageRequestSchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	perPage: z.coerce.number().int().positive().min(1).max(100).default(10),
	sort: z.string().optional(),
	filter: z.string().optional(),
});

export type PageRequest = z.infer<typeof pageRequestSchema>;

/**
 * Constantes de paginação padrão
 */
export const PAGINATION_DEFAULTS = {
	PAGE: 1,
	PER_PAGE: 10,
	MAX_PER_PAGE: 100,
} as const;
