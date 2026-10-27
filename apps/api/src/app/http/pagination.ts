import { z } from 'zod';
export const paginationQuery = z.object({
	page: z.coerce.number().int().min(1).max(100000).default(1),
	perPage: z.coerce.number().int().min(1).max(100).default(20),
	filter: z.string().trim().max(200).optional(),
});

export const pageSchema = {
	querystring: {
		type: 'object',
		properties: {
			page: { type: 'integer', minimum: 1, maximum: 100000, default: 1 },
			perPage: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
			filter: { type: 'string', maxLength: 200 },
			status: { type: 'string' },
		},
	},
	response: {
		200: {
			type: 'object',
			required: ['items', 'total', 'page', 'perPage', 'totalPages'],
			properties: {
				items: {
					type: 'array',
					items: { type: 'object', additionalProperties: true },
				},
				total: { type: 'integer' },
				page: { type: 'integer' },
				perPage: { type: 'integer' },
				totalPages: { type: 'integer' },
			},
		},
	},
};
