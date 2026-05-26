import { describe, expect, it } from 'vitest';
import { AppContainer } from '../../../src/app/http/container';
import { errorHandler } from '../../../src/app/http/middlewares/error-handler';
import traceIdPlugin from '../../../src/app/http/middlewares/trace-id';
import { authRoutes } from '../../../src/app/http/routes/auth.routes';

describe('authRoutes - sem UserRepository configurado', () => {
	it('deve registrar rotas mesmo sem UserRepository para documentação Swagger', async () => {
		// Cria um novo servidor apenas para testar o registro
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		const fastify = (await import('fastify')).default as any;
		const fastifyInstance = fastify({
			logger: false,
		});

		const container = new AppContainer();
		// Não configura UserRepository - deixa undefined

		// Registra middlewares básicos
		await fastifyInstance.register(traceIdPlugin);
		fastifyInstance.setErrorHandler(errorHandler);

		// Registra as rotas sem UserRepository
		await fastifyInstance.register(authRoutes, { container });
		await fastifyInstance.ready();

		// Verifica que as rotas foram registradas
		// As rotas devem estar disponíveis mesmo sem repositório
		expect(fastifyInstance).toBeDefined();

		await fastifyInstance.close();
	});

	it('deve retornar erro 500 ao tentar usar rota sem UserRepository', async () => {
		// Cria servidor com container sem UserRepository
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		const fastify = (await import('fastify')).default as any;
		const fastifyInstance = fastify({
			logger: false,
		});

		const container = new AppContainer();
		// Não configura UserRepository - deixa undefined

		// Registra middlewares básicos
		await fastifyInstance.register(traceIdPlugin);
		fastifyInstance.setErrorHandler(errorHandler);

		// Registra as rotas sem UserRepository
		await fastifyInstance.register(authRoutes, { container });
		await fastifyInstance.ready();

		// Tenta fazer uma requisição - deve retornar erro
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		const response = await (fastifyInstance as any).inject({
			method: 'POST',
			url: '/auth/register',
			payload: {
				name: 'Test User',
				email: 'test@example.com',
				password: 'password123',
			},
		});

		expect(response.statusCode).toBe(500);
		const body = JSON.parse(response.body as string);
		expect(body).toHaveProperty('error');
		expect(body.error).toBe('InternalServerError');
		expect(body.message).toContain('UserRepository não está configurado');

		await fastifyInstance.close();
	});

	it('deve retornar erro 500 ao tentar fazer login sem UserRepository', async () => {
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		const fastify = (await import('fastify')).default as any;
		const fastifyInstance = fastify({
			logger: false,
		});

		const container = new AppContainer();

		await fastifyInstance.register(traceIdPlugin);
		fastifyInstance.setErrorHandler(errorHandler);
		await fastifyInstance.register(authRoutes, { container });
		await fastifyInstance.ready();

		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		const response = await (fastifyInstance as any).inject({
			method: 'POST',
			url: '/auth/login',
			payload: {
				email: 'test@example.com',
				password: 'password123',
			},
		});

		expect(response.statusCode).toBe(500);
		const body = JSON.parse(response.body as string);
		expect(body.message).toContain('UserRepository não está configurado');

		await fastifyInstance.close();
	});

	it('deve retornar erro 500 ao tentar acessar /auth/me sem UserRepository', async () => {
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		const fastify = (await import('fastify')).default as any;
		const fastifyInstance = fastify({
			logger: false,
		});

		const container = new AppContainer();

		await fastifyInstance.register(traceIdPlugin);
		fastifyInstance.setErrorHandler(errorHandler);
		await fastifyInstance.register(authRoutes, { container });
		await fastifyInstance.ready();

		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		const response = await (fastifyInstance as any).inject({
			method: 'GET',
			url: '/auth/me',
			headers: {
				authorization: 'Bearer valid.token.here',
			},
		});

		// Primeiro vai falhar na autenticação, mas se passar, vai falhar no repositório
		expect([401, 500]).toContain(response.statusCode);

		await fastifyInstance.close();
	});
});
