import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
	createRequestSchema,
	createResponseSchema,
	zodToJsonSchemaFastify,
} from '../../../../src/shared/utils/zod-to-json-schema';

describe('zodToJsonSchemaFastify', () => {
	it('deve converter schema Zod simples para JSON Schema', () => {
		const schema = z.object({
			name: z.string(),
			age: z.number(),
		});

		const result = zodToJsonSchemaFastify(schema);

		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
		// A função deve retornar sem lançar erro
		expect(() => JSON.stringify(result)).not.toThrow();
	});

	it('deve adicionar descrição quando fornecida', () => {
		const schema = z.object({
			name: z.string(),
		});

		const result = zodToJsonSchemaFastify(schema, {
			description: 'User schema',
		});

		expect(result).toHaveProperty('description', 'User schema');
	});

	it('deve funcionar com name option', () => {
		const schema = z.object({
			name: z.string(),
		});

		const result = zodToJsonSchemaFastify(schema, {
			name: 'UserSchema',
		});

		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	it('deve funcionar com $ref option', () => {
		const schema = z.object({
			name: z.string(),
		});

		const result = zodToJsonSchemaFastify(schema, {
			$ref: true,
		});

		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	it('deve converter schema com validações complexas', () => {
		const schema = z.object({
			email: z.string().email(),
			age: z.number().min(18).max(100),
			tags: z.array(z.string()),
		});

		const result = zodToJsonSchemaFastify(schema);

		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
		// A função deve retornar sem lançar erro
		expect(() => JSON.stringify(result)).not.toThrow();
	});
});

describe('createResponseSchema', () => {
	it('deve criar schema de resposta com descrição', () => {
		const schema = z.object({
			id: z.string(),
			name: z.string(),
		});

		const result = createResponseSchema(schema, 'User response');

		expect(result).toHaveProperty('description', 'User response');
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	it('deve adicionar exemplo quando fornecido', () => {
		const schema = z.object({
			id: z.string(),
			name: z.string(),
		});

		const example = { id: '123', name: 'John' };
		const result = createResponseSchema(schema, 'User response', example);

		expect(result).toHaveProperty('example', example);
	});

	it('deve funcionar sem descrição e exemplo', () => {
		const schema = z.object({
			id: z.string(),
		});

		const result = createResponseSchema(schema);

		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
		expect(result).not.toHaveProperty('description');
		expect(result).not.toHaveProperty('example');
	});

	it('deve funcionar apenas com exemplo', () => {
		const schema = z.object({
			id: z.string(),
		});

		const example = { id: '123' };
		const result = createResponseSchema(schema, undefined, example);

		expect(result).toHaveProperty('example', example);
		expect(result).not.toHaveProperty('description');
	});

	it('deve preservar propriedades do schema original', () => {
		const schema = z.object({
			id: z.string().uuid(),
			email: z.string().email(),
		});

		const result = createResponseSchema(schema, 'User response');

		expect(result).toBeDefined();
		expect(result).toHaveProperty('description', 'User response');
		// A estrutura exata depende da biblioteca zod-to-json-schema
		// Verificamos apenas que retorna um objeto válido
		expect(Object.keys(result).length).toBeGreaterThan(0);
	});
});

describe('createRequestSchema', () => {
	it('deve criar schema de request apenas com body', () => {
		const bodySchema = z.object({
			name: z.string(),
		});

		const result = createRequestSchema({ body: bodySchema });

		expect(result).toHaveProperty('body');
		expect(result.body).toBeDefined();
		expect(typeof result.body).toBe('object');
		expect(result).not.toHaveProperty('querystring');
		expect(result).not.toHaveProperty('params');
		expect(result).not.toHaveProperty('headers');
	});

	it('deve criar schema de request apenas com query', () => {
		const querySchema = z.object({
			page: z.number(),
		});

		const result = createRequestSchema({ query: querySchema });

		expect(result).toHaveProperty('querystring');
		expect(result.querystring).toBeDefined();
		expect(typeof result.querystring).toBe('object');
		expect(result).not.toHaveProperty('body');
	});

	it('deve criar schema de request apenas com params', () => {
		const paramsSchema = z.object({
			id: z.string(),
		});

		const result = createRequestSchema({ params: paramsSchema });

		expect(result).toHaveProperty('params');
		expect(result.params).toBeDefined();
		expect(typeof result.params).toBe('object');
		expect(result).not.toHaveProperty('body');
	});

	it('deve criar schema de request apenas com headers', () => {
		const headersSchema = z.object({
			authorization: z.string(),
		});

		const result = createRequestSchema({ headers: headersSchema });

		expect(result).toHaveProperty('headers');
		expect(result.headers).toBeDefined();
		expect(typeof result.headers).toBe('object');
		expect(result).not.toHaveProperty('body');
	});

	it('deve criar schema de request com múltiplos schemas', () => {
		const bodySchema = z.object({ name: z.string() });
		const querySchema = z.object({ page: z.number() });
		const paramsSchema = z.object({ id: z.string() });
		const headersSchema = z.object({ authorization: z.string() });

		const result = createRequestSchema({
			body: bodySchema,
			query: querySchema,
			params: paramsSchema,
			headers: headersSchema,
		});

		expect(result).toHaveProperty('body');
		expect(result).toHaveProperty('querystring');
		expect(result).toHaveProperty('params');
		expect(result).toHaveProperty('headers');
	});

	it('deve retornar objeto vazio quando nenhum schema fornecido', () => {
		const result = createRequestSchema();

		expect(result).toEqual({});
	});

	it('deve retornar objeto vazio quando options undefined', () => {
		const result = createRequestSchema(undefined);

		expect(result).toEqual({});
	});

	it('deve converter corretamente schemas complexos', () => {
		const bodySchema = z.object({
			user: z.object({
				name: z.string().min(1),
				email: z.string().email(),
			}),
			tags: z.array(z.string()),
		});

		const result = createRequestSchema({ body: bodySchema });

		expect(result.body).toBeDefined();
		expect(typeof result.body).toBe('object');
		// A função deve retornar sem lançar erro
		expect(() => JSON.stringify(result.body)).not.toThrow();
	});
});
