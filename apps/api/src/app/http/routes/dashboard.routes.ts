import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
	GetDashboardCashRegisterUseCase,
	GetDashboardCustomersUseCase,
	GetDashboardInventoryUseCase,
	GetDashboardOrdersUseCase,
	GetDashboardOverviewUseCase,
	GetDashboardReportsUseCase,
	GetDashboardSuppliersUseCase,
} from '../../../core/application/use-cases/dashboard';
import {
	createResponseSchema,
} from '../../../shared/utils/zod-to-json-schema';
import type { AppContainer } from '../container';
import { authMiddleware } from '../middlewares/auth';

const metricSchema = z.object({
	label: z.string(),
	value: z.string(),
	description: z.string(),
	tone: z.enum(['info', 'muted', 'success', 'warning']),
});

const tableRowSchema = z.record(z.string(), z.union([z.string(), z.number()]));

const overviewSchema = z.object({
	store: z.object({
		name: z.string(),
		status: z.string(),
		operatorName: z.string(),
		operatorRole: z.string(),
	}),
	header: z.object({
		title: z.string(),
		description: z.string(),
	}),
	metrics: z.array(metricSchema),
	salesPulse: z.object({
		title: z.string(),
		description: z.string(),
		status: z.string(),
		hours: z.array(z.string()),
		values: z.array(z.number()),
	}),
	spotlight: z.object({
		eyebrow: z.string(),
		name: z.string(),
		description: z.string(),
	}),
	inventoryRisk: z.object({
		title: z.string(),
		description: z.string(),
		rows: z.array(tableRowSchema),
	}),
	actionRail: z.array(
		z.object({
			title: z.string(),
			value: z.string(),
			description: z.string(),
			tone: z.enum(['info', 'muted', 'success', 'warning']),
		}),
	),
	checklist: z.array(
		z.object({
			task: z.string(),
			time: z.string(),
		}),
	),
});

const summaryResponseSchema = z.object({
	summary: z.array(metricSchema),
});

const ordersSchema = summaryResponseSchema.extend({
	queues: z.array(
		z.object({
			status: z.string(),
			count: z.number(),
			description: z.string(),
		}),
	),
	orders: z.array(tableRowSchema),
});

const inventorySchema = summaryResponseSchema.extend({
	products: z.array(tableRowSchema),
	movements: z.array(tableRowSchema),
});

const customersSchema = summaryResponseSchema.extend({
	customers: z.array(tableRowSchema),
	segments: z.array(
		z.object({
			name: z.string(),
			count: z.number(),
			revenue: z.string(),
		}),
	),
});

const cashRegisterSchema = summaryResponseSchema.extend({
	paymentMethods: z.array(tableRowSchema),
	currentSale: z.array(tableRowSchema),
	closingTasks: z.array(tableRowSchema),
});

const suppliersSchema = summaryResponseSchema.extend({
	suppliers: z.array(tableRowSchema),
	receivings: z.array(tableRowSchema),
});

const reportsSchema = summaryResponseSchema.extend({
	reports: z.array(tableRowSchema),
	series: z.array(
		z.object({
			name: z.string(),
			values: z.array(z.number()),
		}),
	),
	periods: z.array(z.string()),
});

const authErrorSchema = z.object({
	error: z.string(),
	message: z.string(),
	traceId: z.string().optional(),
});

export async function dashboardRoutes(
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos, necessário type assertion
	fastify: any,
	options: { container: AppContainer },
) {
	const { container } = options;

	if (!container.dashboardRepository) {
		throw new Error('DashboardRepository precisa estar configurado.');
	}

	const useCases = {
		cashRegister: new GetDashboardCashRegisterUseCase(
			container.dashboardRepository,
		),
		customers: new GetDashboardCustomersUseCase(container.dashboardRepository),
		inventory: new GetDashboardInventoryUseCase(container.dashboardRepository),
		orders: new GetDashboardOrdersUseCase(container.dashboardRepository),
		overview: new GetDashboardOverviewUseCase(container.dashboardRepository),
		reports: new GetDashboardReportsUseCase(container.dashboardRepository),
		suppliers: new GetDashboardSuppliersUseCase(container.dashboardRepository),
	};

	registerReadRoute(fastify, {
		path: '/dashboard/overview',
		description: 'Obtém dados de visão geral do dashboard da loja',
		feature: 'dashboard.overview',
		responseSchema: overviewSchema,
		execute: (userId) => useCases.overview.execute({ userId }),
		container,
	});
	registerReadRoute(fastify, {
		path: '/dashboard/orders',
		description: 'Obtém dados operacionais de pedidos',
		feature: 'dashboard.orders',
		responseSchema: ordersSchema,
		execute: (userId) => useCases.orders.execute({ userId }),
		container,
	});
	registerReadRoute(fastify, {
		path: '/dashboard/inventory',
		description: 'Obtém dados de estoque e movimentações',
		feature: 'dashboard.inventory',
		responseSchema: inventorySchema,
		execute: (userId) => useCases.inventory.execute({ userId }),
		container,
	});
	registerReadRoute(fastify, {
		path: '/dashboard/customers',
		description: 'Obtém dados de clientes e segmentos',
		feature: 'dashboard.customers',
		responseSchema: customersSchema,
		execute: (userId) => useCases.customers.execute({ userId }),
		container,
	});
	registerReadRoute(fastify, {
		path: '/dashboard/cash-register',
		description: 'Obtém dados do caixa e venda atual',
		feature: 'dashboard.cashRegister',
		responseSchema: cashRegisterSchema,
		execute: (userId) => useCases.cashRegister.execute({ userId }),
		container,
	});
	registerReadRoute(fastify, {
		path: '/dashboard/suppliers',
		description: 'Obtém dados de fornecedores e recebimentos',
		feature: 'dashboard.suppliers',
		responseSchema: suppliersSchema,
		execute: (userId) => useCases.suppliers.execute({ userId }),
		container,
	});
	registerReadRoute(fastify, {
		path: '/dashboard/reports',
		description: 'Obtém dados dos relatórios operacionais',
		feature: 'dashboard.reports',
		responseSchema: reportsSchema,
		execute: (userId) => useCases.reports.execute({ userId }),
		container,
	});
}

function registerReadRoute<TResponse>(
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos, necessário type assertion
	fastify: any,
	options: {
		path: string;
		description: string;
		feature:
			| 'dashboard.cashRegister'
			| 'dashboard.customers'
			| 'dashboard.inventory'
			| 'dashboard.orders'
			| 'dashboard.overview'
			| 'dashboard.reports'
			| 'dashboard.suppliers';
		responseSchema: z.ZodTypeAny;
		execute: (userId: string) => Promise<TResponse>;
		container: AppContainer;
	},
) {
	const preHandler = async (request: FastifyRequest, reply: unknown) => {
		options.container.featureFlags.assertEnabled('dashboard');
		options.container.featureFlags.assertEnabled(options.feature);
		await authMiddleware(request, reply, options.container.jwtService);
	};

	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).get(
		options.path,
		{
			schema: {
				description: options.description,
				tags: ['dashboard'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					200: createResponseSchema(options.responseSchema, options.description),
					401: createResponseSchema(
						authErrorSchema,
						'Token ausente ou inválido',
						{
							error: 'AuthError',
							message: 'Token de autenticação não fornecido',
						},
					),
					403: createResponseSchema(
						authErrorSchema,
						'Funcionalidade desabilitada',
						{
							error: 'FeatureDisabledError',
							message: 'Funcionalidade temporariamente indisponível.',
						},
					),
				},
			},
			preHandler,
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any) => {
			const user = getAuthenticatedUser(request);
			return options.execute(user.userId);
		},
	);
}

function getAuthenticatedUser(request: FastifyRequest) {
	if (!request.user) {
		throw new Error('Usuário autenticado não encontrado na requisição');
	}

	return request.user;
}
