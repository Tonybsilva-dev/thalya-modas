import swagger from '@fastify/swagger';
import type { FastifyInstance } from 'fastify';
import fastify from 'fastify';
import { getSwaggerConfig } from '../../../src/app/http/config/swagger.config';
import { AppContainer } from '../../../src/app/http/container';
import { healthcheckRoutes } from '../../../src/app/http/healthcheck/healthcheck.routes';
import { errorHandler } from '../../../src/app/http/middlewares/error-handler';
import traceIdPlugin from '../../../src/app/http/middlewares/trace-id';
import { authRoutes } from '../../../src/app/http/routes/auth.routes';
import type { UserRepository } from '../../../src/core/domain/repositories/user-repository';
import { MockUserRepository } from '../../unit/core/domain/repositories/mock-user-repository';

/**
 * Helper para criar uma instância do servidor Fastify configurada para testes
 * - Configura UserRepository mock
 * - Registra rotas de autenticação
 * - Retorna servidor pronto para usar com inject()
 * - Não registra Swagger para evitar problemas de validação em testes
 */
export async function createTestServer(
	userRepository?: UserRepository,
): Promise<FastifyInstance> {
	// Cria servidor Fastify para testes
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	const server = (fastify as any)({
		logger: false, // Desabilita logs em testes
		disableRequestLogging: true,
		// Desabilita validação de schemas de resposta para evitar problemas com $ref
		disableRequestValidation: false, // Mantém validação de request
		disableResponseValidation: true, // Desabilita validação de response
		// Configura Ajv para ignorar propriedades desconhecidas como 'example' e 'examples'
		// Isso permite adicionar exemplos nos schemas sem quebrar a validação
		ajv: {
			customOptions: {
				strict: false, // Desabilita strict mode para permitir propriedades como 'example'
				removeAdditional: false,
			},
		},
	});

	// Registra middleware de traceId PRIMEIRO para garantir que os hooks sejam executados
	await server.register(traceIdPlugin);

	// Registra Swagger com configuração mínima para que os schemas $ref funcionem
	// biome-ignore lint/suspicious/noExplicitAny: Necessário para compatibilidade com tipos do Fastify Swagger
	await server.register(swagger, getSwaggerConfig() as any);

	// Registra middleware global de erros
	server.setErrorHandler(errorHandler);

	// Registra rotas de healthcheck
	await server.register(healthcheckRoutes);

	// Cria container de dependências
	const container = new AppContainer();

	// Usa o repositório fornecido ou cria um mock
	const repository = userRepository ?? new MockUserRepository();
	container.setUserRepository(repository);

	// Registra rotas de autenticação (depois do Swagger estar registrado)
	await server.register(authRoutes, { container });

	// Registra rota raiz para testes
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(server as any).get(
		'/',
		{
			schema: {
				description: 'Rota raiz da API',
				tags: ['root'],
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any, reply: any) => {
			// Garante que o header seja adicionado mesmo se o hook falhar
			const traceId = request.traceId;
			if (traceId) {
				reply.header('X-Trace-Id', traceId);
			}
			return {
				message: 'Fastify Boilerplate API',
				version: '1.0.0',
				docs: '/docs',
			};
		},
	);

	// Aguarda o servidor estar completamente pronto
	await server.ready();

	return server;
}

/**
 * Helper para fazer requisições HTTP no servidor de teste
 * Wrapper sobre o método inject() do Fastify
 */
export interface TestRequest {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	url: string;
	headers?: Record<string, string>;
	body?: unknown;
	query?: Record<string, string>;
}

export async function makeRequest(
	server: FastifyInstance,
	request: TestRequest,
): Promise<{
	statusCode: number;
	headers: Record<string, string>;
	body: unknown;
}> {
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos com inject
	const response = await (server as any).inject({
		method: request.method,
		url: request.url,
		headers: request.headers,
		payload: request.body,
		query: request.query,
	});

	let parsedBody: unknown;
	try {
		parsedBody = JSON.parse(response.body as string);
	} catch {
		parsedBody = response.body;
	}

	// Normaliza os headers para garantir que todos sejam acessíveis
	const normalizedHeaders: Record<string, string> = {};

	// Tenta acessar headers de múltiplas formas
	// O Fastify inject() pode retornar headers em diferentes propriedades
	const rawHeaders =
		(response.headers as Record<string, string | string[]>) ||
		(response as { raw?: { headers?: Record<string, string | string[]> } }).raw
			?.headers ||
		({} as Record<string, string | string[]>);

	// Debug temporário: verifica headers retornados
	if (process.env.DEBUG_HEADERS) {
		console.log('Response object keys:', Object.keys(response));
		console.log('Raw headers from inject:', Object.keys(rawHeaders));
		console.log('All headers:', rawHeaders);
	}

	for (const [key, value] of Object.entries(rawHeaders)) {
		// Converte arrays para string (pega o primeiro valor)
		const headerValue = Array.isArray(value) ? value[0] : value;
		// Mantém a chave original e também adiciona em minúsculas para busca case-insensitive
		normalizedHeaders[key] = headerValue;
		normalizedHeaders[key.toLowerCase()] = headerValue;
	}

	// Debug temporário: verifica headers normalizados
	if (process.env.DEBUG_HEADERS) {
		console.log('Normalized headers:', normalizedHeaders);
	}

	return {
		statusCode: response.statusCode as number,
		headers: normalizedHeaders,
		body: parsedBody,
	};
}
