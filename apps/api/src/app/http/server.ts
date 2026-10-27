import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fastify from 'fastify';
import Redis from 'ioredis';
import { PlanAccessService } from '../../core/application/plan-access';
import { SalesService } from '../../core/application/sales';
import { RedisSecurityStore } from '../../core/infra/auth/security-store';
import {
	InMemoryCatalogRepository,
	InMemoryDashboardRepository,
	InMemoryOnboardingRepository,
	InMemoryPasswordRecoveryRepository,
	InMemoryStoreRepository,
	InMemoryUserRepository,
	PrismaCatalogRepository,
	PrismaOnboardingRepository,
	PrismaPasswordRecoveryRepository,
	PrismaStoreRepository,
	PrismaUserRepository,
	prisma,
	seedPreviewUser,
} from '../../core/infra/persistence';
import { InMemoryCustomerRepository } from '../../core/infra/persistence/in-memory/in-memory-customer-repository';
import { InMemoryPlanRepository } from '../../core/infra/persistence/in-memory/in-memory-plan-repository';
import { PrismaCustomerRepository } from '../../core/infra/persistence/prisma/prisma-customer-repository';
import { PrismaDashboardRepository } from '../../core/infra/persistence/prisma/prisma-dashboard-repository';
import { PrismaPlanRepository } from '../../core/infra/persistence/prisma/prisma-plan-repository';
import type { R2StorageConfig } from '../../core/infra/storage/r2-presigned-upload';
import { env } from '../../shared/env';
import { getCorsConfig } from './config/cors.config';
import { getSwaggerConfig } from './config/swagger.config';
import { getSwaggerUIConfig } from './config/swagger-ui.config';
import { AppContainer } from './container';
import { healthcheckRoutes } from './healthcheck/healthcheck.routes';
import { errorHandler } from './middlewares/error-handler';
import performancePlugin from './middlewares/performance';
import { registerPlanGate } from './middlewares/plan-gate';
import traceIdPlugin from './middlewares/trace-id';
import { prismaAdministrativeTransaction } from './prisma-administrative-transaction';
import { authRoutes } from './routes/auth.routes';
import { catalogRoutes } from './routes/catalog.routes';
import { customerRoutes } from './routes/customer.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { errorExampleRoutes } from './routes/error-example.routes';
import { internalMetricsRoutes } from './routes/internal-metrics.routes';
import { onboardingRoutes } from './routes/onboarding.routes';
import { planRoutes } from './routes/plan.routes';
import { salesRoutes } from './routes/sales.routes';
import { tenantRoutes } from './routes/tenant.routes';
import { userRoutes } from './routes/user.routes';

// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos, necessário type assertion
const server = (fastify as any)({
	logger: {
		level: env.NODE_ENV === 'production' ? 'info' : 'debug',
		redact: [
			'req.headers.authorization',
			'req.headers.cookie',
			'res.headers["set-cookie"]',
		],
		transport:
			env.NODE_ENV === 'development'
				? {
						target: 'pino-pretty',
						options: {
							translateTime: 'HH:MM:ss Z',
							ignore: 'pid,hostname',
						},
					}
				: undefined,
	},
	// Configurações de timeout e limites para resiliência
	bodyLimit: 1024 * 1024, // 1MB
	connectionTimeout: 10000, // 10s
	keepAliveTimeout: 5000, // 5s
	requestTimeout: 30000, // 30s
	trustProxy: env.TRUST_PROXY, // Confiar em proxies (útil para Docker, load balancers, etc.)
	// Configura Ajv para ignorar propriedades desconhecidas como 'example' e 'examples'
	// Isso permite adicionar exemplos nos schemas sem quebrar a validação
	ajv: {
		customOptions: {
			strict: false, // Desabilita strict mode para permitir propriedades como 'example'
			removeAdditional: false,
		},
	},
});

async function build() {
	// Registra Security Headers com Helmet
	await server.register(helmet, {
		contentSecurityPolicy: false, // Pode ser configurado depois se necessário
		crossOriginEmbedderPolicy: false,
	});

	// Registra CORS
	await server.register(cors, getCorsConfig());
	if (env.NODE_ENV !== 'development') {
		// Registra Rate Limiting Global
		await server.register(rateLimit, {
			max: 100, // 100 requisições
			timeWindow: '1 minute', // por minuto
			// biome-ignore lint/suspicious/noExplicitAny: Fastify rate-limit types
			errorResponseBuilder: (_request: any, context: any) => {
				return {
					code: 429,
					error: 'Too Many Requests',
					message: `Rate limit exceeded, retry in ${context.ttl} seconds`,
					date: Date.now(),
					expiresIn: context.ttl,
				};
			},
		});
	}

	// Registra Swagger com configuração completa e profissional
	// biome-ignore lint/suspicious/noExplicitAny: Necessário para compatibilidade com tipos do Fastify Swagger
	await server.register(swagger, getSwaggerConfig() as any);

	// Registra Swagger UI com configuração otimizada
	await server.register(swaggerUI, getSwaggerUIConfig());

	// Registra middleware de traceId (deve ser registrado antes das rotas)
	await server.register(traceIdPlugin);

	// Registra middleware de performance (mede o tempo total da requisição)
	await server.register(performancePlugin);

	// Registra middleware global de erros
	server.setErrorHandler(errorHandler);

	// Registra rotas
	const redis = env.REDIS_URL
		? new Redis(env.REDIS_URL, {
				lazyConnect: true,
				connectTimeout: 2000,
				commandTimeout: 2000,
				maxRetriesPerRequest: 1,
				enableOfflineQueue: false,
			})
		: undefined;
	redis?.on('error', () => server.log.warn('Redis indisponível'));
	if (redis)
		await redis
			.connect()
			.catch(() => server.log.warn('Não foi possível conectar ao Redis'));
	const container = new AppContainer({
		securityStore: redis ? new RedisSecurityStore(redis) : undefined,
	});
	server.addHook('onClose', async () => {
		redis?.disconnect();
	});
	await server.register(healthcheckRoutes, {
		checks: {
			database:
				env.PERSISTENCE_DRIVER === 'postgres'
					? () => prisma.$queryRaw`SELECT 1`
					: undefined,
			redis: redis ? () => redis.ping() : undefined,
		},
	});
	container.planAccess = new PlanAccessService(
		env.PERSISTENCE_DRIVER === 'postgres'
			? new PrismaPlanRepository(prisma)
			: new InMemoryPlanRepository(),
	);
	registerPlanGate(server, container);
	container.customerRepository =
		env.PERSISTENCE_DRIVER === 'postgres'
			? new PrismaCustomerRepository(prisma)
			: new InMemoryCustomerRepository();
	const r2StorageConfig = getR2StorageConfig();
	container.setDashboardRepository(
		env.PERSISTENCE_DRIVER === 'postgres'
			? new PrismaDashboardRepository(prisma)
			: new InMemoryDashboardRepository(),
	);

	if (env.PERSISTENCE_DRIVER === 'postgres') {
		container.setCatalogRepository(
			new PrismaCatalogRepository(prisma, r2StorageConfig),
		);
		container.setUserRepository(new PrismaUserRepository(prisma));
		container.setPasswordRecoveryRepository(
			new PrismaPasswordRecoveryRepository(prisma),
		);
		container.setStoreRepository(new PrismaStoreRepository(prisma));
		container.administrativeTransaction =
			prismaAdministrativeTransaction(prisma);
		container.setOnboardingRepository(new PrismaOnboardingRepository(prisma));
		if (env.SEED_PREVIEW_USER_ENABLED) {
			await seedPreviewUser(prisma);
		}
	} else {
		container.setStoreRepository(new InMemoryStoreRepository());
		container.setCatalogRepository(
			new InMemoryCatalogRepository(
				container.storeRepository!,
				r2StorageConfig,
			),
		);
		container.setUserRepository(new InMemoryUserRepository());
		container.setPasswordRecoveryRepository(
			new InMemoryPasswordRecoveryRepository(),
		);
		container.setOnboardingRepository(new InMemoryOnboardingRepository());
	}

	await server.register(authRoutes, { container });
	await server.register(catalogRoutes, { container });
	await server.register(customerRoutes, { container });
	if (env.PERSISTENCE_DRIVER === 'postgres')
		container.sales = new SalesService(prisma);
	await server.register(salesRoutes, { container });
	await server.register(dashboardRoutes, { container });
	await server.register(onboardingRoutes, { container });
	await server.register(userRoutes, { container });
	await server.register(planRoutes, { container });
	await server.register(tenantRoutes, { container });

	// Rotas de exemplo de erros (apenas para desenvolvimento/documentação)
	if (env.NODE_ENV !== 'production') {
		await server.register(errorExampleRoutes);
		await server.register(internalMetricsRoutes);
	}

	// Rota raiz
	server.get(
		'/',
		{
			schema: {
				description: 'Rota raiz da API',
				tags: ['root'],
				response: {
					200: {
						type: 'object',
						properties: {
							message: { type: 'string' },
							version: { type: 'string' },
							docs: { type: 'string' },
						},
					},
				},
			},
		},
		async () => {
			return {
				message: 'Store Flow API',
				version: env.API_VERSION,
				docs: '/docs',
			};
		},
	);

	return server;
}

async function start() {
	try {
		const app = await build();
		await app.listen({
			port: env.PORT,
			host: env.HOST,
		});

		app.log.info(`🚀 Servidor rodando em http://${env.HOST}:${env.PORT}`);
		app.log.info(
			`📚 Documentação disponível em http://${env.HOST}:${env.PORT}/docs`,
		);
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
}

process.on('SIGINT', async () => {
	await prisma.$disconnect();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	await prisma.$disconnect();
	process.exit(0);
});

// Inicia o servidor se este arquivo for executado diretamente
if (require.main === module) {
	start();
}

export { build, start };

function getR2StorageConfig(): R2StorageConfig | undefined {
	if (
		!env.R2_ENDPOINT ||
		!env.R2_ACCESS_KEY ||
		!env.R2_SECRET_KEY ||
		!env.R2_BUCKET_NAME
	) {
		return undefined;
	}

	return {
		accessKeyId: env.R2_ACCESS_KEY,
		bucketName: env.R2_BUCKET_NAME,
		endpoint: env.R2_ENDPOINT,
		publicUrl: env.R2_PUBLIC_URL,
		secretAccessKey: env.R2_SECRET_KEY,
	};
}
