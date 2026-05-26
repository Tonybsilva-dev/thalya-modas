import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createPageSchema } from '../../../../src/shared/pagination/page.schema';

describe('createPageSchema', () => {
	it('deve criar schema válido para Page com itemSchema simples', () => {
		const itemSchema = z.object({
			id: z.string(),
			name: z.string(),
		});

		const pageSchema = createPageSchema(itemSchema);

		const validData = {
			items: [
				{ id: '1', name: 'Item 1' },
				{ id: '2', name: 'Item 2' },
			],
			total: 2,
			page: 1,
			perPage: 10,
			totalPages: 1,
		};

		const result = pageSchema.safeParse(validData);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.items).toHaveLength(2);
			expect(result.data.total).toBe(2);
			expect(result.data.page).toBe(1);
			expect(result.data.perPage).toBe(10);
			expect(result.data.totalPages).toBe(1);
		}
	});

	it('deve rejeitar quando items não é array', () => {
		const itemSchema = z.object({ id: z.string() });
		const pageSchema = createPageSchema(itemSchema);

		const invalidData = {
			items: 'not-an-array',
			total: 0,
			page: 1,
			perPage: 10,
			totalPages: 0,
		};

		const result = pageSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it('deve rejeitar quando items não corresponde ao itemSchema', () => {
		const itemSchema = z.object({
			id: z.string(),
			name: z.string(),
		});
		const pageSchema = createPageSchema(itemSchema);

		const invalidData = {
			items: [{ id: '1' }], // falta 'name'
			total: 1,
			page: 1,
			perPage: 10,
			totalPages: 1,
		};

		const result = pageSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it('deve rejeitar quando total é negativo', () => {
		const itemSchema = z.object({ id: z.string() });
		const pageSchema = createPageSchema(itemSchema);

		const invalidData = {
			items: [],
			total: -1,
			page: 1,
			perPage: 10,
			totalPages: 0,
		};

		const result = pageSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it('deve rejeitar quando page não é positivo', () => {
		const itemSchema = z.object({ id: z.string() });
		const pageSchema = createPageSchema(itemSchema);

		const invalidData = {
			items: [],
			total: 0,
			page: 0, // deve ser positivo
			perPage: 10,
			totalPages: 0,
		};

		const result = pageSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it('deve rejeitar quando perPage não é positivo', () => {
		const itemSchema = z.object({ id: z.string() });
		const pageSchema = createPageSchema(itemSchema);

		const invalidData = {
			items: [],
			total: 0,
			page: 1,
			perPage: 0, // deve ser positivo
			totalPages: 0,
		};

		const result = pageSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it('deve rejeitar quando totalPages é negativo', () => {
		const itemSchema = z.object({ id: z.string() });
		const pageSchema = createPageSchema(itemSchema);

		const invalidData = {
			items: [],
			total: 0,
			page: 1,
			perPage: 10,
			totalPages: -1,
		};

		const result = pageSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it('deve aceitar totalPages zero quando não há itens', () => {
		const itemSchema = z.object({ id: z.string() });
		const pageSchema = createPageSchema(itemSchema);

		const validData = {
			items: [],
			total: 0,
			page: 1,
			perPage: 10,
			totalPages: 0,
		};

		const result = pageSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it('deve funcionar com itemSchema complexo', () => {
		const itemSchema = z.object({
			id: z.string().uuid(),
			name: z.string().min(1),
			email: z.string().email(),
			metadata: z.object({
				createdAt: z.date(),
				tags: z.array(z.string()),
			}),
		});

		const pageSchema = createPageSchema(itemSchema);

		const validData = {
			items: [
				{
					id: '123e4567-e89b-12d3-a456-426614174000',
					name: 'User 1',
					email: 'user1@example.com',
					metadata: {
						createdAt: new Date(),
						tags: ['admin', 'active'],
					},
				},
			],
			total: 1,
			page: 1,
			perPage: 10,
			totalPages: 1,
		};

		const result = pageSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it('deve rejeitar quando itemSchema complexo falha validação', () => {
		const itemSchema = z.object({
			id: z.string().uuid(),
			email: z.string().email(),
		});

		const pageSchema = createPageSchema(itemSchema);

		const invalidData = {
			items: [
				{
					id: 'not-a-uuid',
					email: 'not-an-email',
				},
			],
			total: 1,
			page: 1,
			perPage: 10,
			totalPages: 1,
		};

		const result = pageSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});
});
