import type { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

/**
 * Mapeamento de exemplos de request body por rota
 * Usado para adicionar exemplos no formato OpenAPI 3.0 via transformSpecification
 */
const requestBodyExamples: Record<
	string,
	{ method: string; example: unknown }
> = {
	'/auth/register': {
		method: 'post',
		example: {
			name: 'João Silva',
			email: 'joao.silva@example.com',
			password: 'senhaSegura123',
		},
	},
	'/auth/login': {
		method: 'post',
		example: {
			email: 'joao.silva@example.com',
			password: 'senhaSegura123',
		},
	},
};

/**
 * Adiciona exemplos de request body no formato OpenAPI 3.0
 * Isso é necessário porque o Fastify não suporta 'example' nos schemas de validação
 */
function addRequestBodyExamples(swaggerObject: {
	paths?: Record<
		string,
		Record<string, { requestBody?: unknown; [key: string]: unknown }>
	>;
}): void {
	if (!swaggerObject.paths) {
		return;
	}

	for (const [path, methods] of Object.entries(swaggerObject.paths)) {
		const exampleConfig = requestBodyExamples[path];
		if (!exampleConfig) {
			continue;
		}

		const method = methods[exampleConfig.method];
		if (!method) {
			continue;
		}

		// O Fastify Swagger pode gerar requestBody de duas formas:
		// 1. Diretamente como schema (formato antigo)
		// 2. Como objeto com content (formato OpenAPI 3.0)

		// Se já existe requestBody, adiciona exemplo
		if (method.requestBody) {
			const requestBody = method.requestBody as {
				content?: {
					'application/json'?: {
						schema?: unknown;
						example?: unknown;
					};
				};
				schema?: unknown;
			};

			// Formato OpenAPI 3.0 com content
			if (requestBody.content) {
				if (requestBody.content['application/json']) {
					requestBody.content['application/json'].example =
						exampleConfig.example;
				} else {
					requestBody.content['application/json'] = {
						schema: requestBody.schema,
						example: exampleConfig.example,
					};
				}
			} else {
				// Converte para formato OpenAPI 3.0
				const schema = requestBody.schema || method.requestBody;
				method.requestBody = {
					content: {
						'application/json': {
							schema,
							example: exampleConfig.example,
						},
					},
				};
			}
		} else {
			// Se não existe requestBody, cria um novo
			// Primeiro, tenta pegar o schema do body se existir
			const bodySchema = (method as { schema?: { body?: unknown } }).schema
				?.body;
			if (bodySchema) {
				method.requestBody = {
					content: {
						'application/json': {
							schema: bodySchema,
							example: exampleConfig.example,
						},
					},
				};
			}
		}
	}
}

/**
 * Configuração do Swagger UI com opções profissionais
 */
export function getSwaggerUIConfig(): FastifySwaggerUiOptions {
	return {
		routePrefix: '/docs',
		uiConfig: {
			docExpansion: 'list', // 'none' | 'list' | 'full'
			deepLinking: true,
			defaultModelsExpandDepth: 2,
			defaultModelExpandDepth: 2,
			defaultModelRendering: 'example', // 'example' | 'model'
			displayRequestDuration: true,
			filter: true,
			showExtensions: true,
			showCommonExtensions: true,
			tryItOutEnabled: true,
		},
		uiHooks: {
			onRequest: (_request: unknown, _reply: unknown, next: () => void) => {
				next();
			},
			preHandler: (_request: unknown, _reply: unknown, next: () => void) => {
				next();
			},
		},
		staticCSP: true,
		transformStaticCSP: (header) => header,
		transformSpecification: (swaggerObject, _request, _reply) => {
			// Adiciona exemplos de request body no formato OpenAPI 3.0
			addRequestBodyExamples(swaggerObject);
			return swaggerObject;
		},
		transformSpecificationClone: true,
	};
}
