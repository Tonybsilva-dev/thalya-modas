import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Garante que o schema seja um objeto JSON Schema puro (sem $ref externos),
 * clonado para não ser mutado pelo Ref do Fastify/Swagger.
 * Inline definições quando o resultado tiver $ref + definitions.
 */
function toPlainJsonSchema(jsonSchema: unknown): Record<string, unknown> {
	if (jsonSchema === null || typeof jsonSchema !== 'object') {
		return {};
	}
	const obj = jsonSchema as Record<string, unknown>;
	// Se tiver $ref e definitions, usar o schema referenciado para documentação inline
	if (
		obj.$ref &&
		typeof obj.$ref === 'string' &&
		obj.definitions &&
		typeof obj.definitions === 'object'
	) {
		const key = obj.$ref.split('/').pop();
		const defs = obj.definitions as Record<string, unknown>;
		if (key && defs[key]) {
			return toPlainJsonSchema(defs[key]);
		}
	}
	return JSON.parse(JSON.stringify(obj));
}

/**
 * Converte um schema Zod para JSON Schema compatível com Fastify Swagger
 * @param schema - Schema Zod a ser convertido
 * @param options - Opções adicionais para a conversão
 * @returns JSON Schema compatível com OpenAPI (objeto puro para o Swagger exibir corretamente)
 */
export function zodToJsonSchemaFastify(
	schema: z.ZodTypeAny,
	options?: {
		name?: string;
		description?: string;
		$ref?: boolean;
	},
) {
	// Cast necessário devido à incompatibilidade de tipos entre versões do Zod
	// biome-ignore lint/suspicious/noExplicitAny: Necessário para compatibilidade com zod-to-json-schema
	const jsonSchema = zodToJsonSchema(schema as any, {
		target: 'openApi3',
		$refStrategy: options?.$ref ? 'root' : 'none',
		name: options?.name,
	});

	const plain = toPlainJsonSchema(jsonSchema) as Record<string, unknown>;

	// Adiciona descrição se fornecida
	if (options?.description) {
		plain.description = options.description;
	}

	return plain;
}

/**
 * Cria um schema de resposta padronizado para Fastify
 * @param schema - Schema Zod para o body da resposta
 * @param description - Descrição da resposta
 * @param example - Exemplo JSON opcional para exibir no Swagger
 * @returns Schema de resposta formatado para Fastify (JSON Schema direto)
 */
export function createResponseSchema(
	schema: z.ZodTypeAny,
	description?: string,
	example?: unknown,
) {
	const jsonSchema = zodToJsonSchemaFastify(schema);
	// Clone para o Swagger não receber referência mutada pelo Ref do Fastify
	const result: Record<string, unknown> = { ...toPlainJsonSchema(jsonSchema) };

	if (description) {
		result.description = description;
	}

	if (example !== undefined) {
		result.example = example;
	}

	return result;
}

/**
 * Cria um schema de request padronizado para Fastify
 * NOTA: Não inclui exemplos aqui porque o Fastify usa esses schemas para validação
 * e o JSON Schema strict mode não permite a palavra-chave "example".
 * Para adicionar exemplos, use a propriedade "examples" diretamente no schema da rota.
 * @param options - Opções com schemas Zod para body, query, params e headers
 * @returns Schema de request formatado para Fastify (sem exemplos)
 */
export function createRequestSchema(options?: {
	body?: z.ZodTypeAny;
	query?: z.ZodTypeAny;
	params?: z.ZodTypeAny;
	headers?: z.ZodTypeAny;
}) {
	const schema: {
		body?: unknown;
		querystring?: unknown;
		params?: unknown;
		headers?: unknown;
	} = {};

	if (options?.body) {
		schema.body = toPlainJsonSchema(zodToJsonSchemaFastify(options.body));
	}

	if (options?.query) {
		schema.querystring = toPlainJsonSchema(
			zodToJsonSchemaFastify(options.query),
		);
	}

	if (options?.params) {
		schema.params = toPlainJsonSchema(zodToJsonSchemaFastify(options.params));
	}

	if (options?.headers) {
		schema.headers = toPlainJsonSchema(zodToJsonSchemaFastify(options.headers));
	}

	return schema;
}
