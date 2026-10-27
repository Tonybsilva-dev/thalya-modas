import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createRequestSchema } from '../../../shared/utils/zod-to-json-schema';
import type { AppContainer } from '../container';
import { DomainError } from '../errors/domain-error';
import { ForbiddenError } from '../errors/forbidden-error';
import { authMiddleware } from '../middlewares/auth';
import { storeContextMiddleware } from '../middlewares/store-context';

const cents = z.number().int().min(0).max(2_000_000_000);
const positiveCents = cents.min(1);
const key = z.uuid();
const payment = z.object({
	amountCents: positiveCents,
	method: z.enum(['CASH', 'PIX', 'CARD']),
});
const date = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/)
	.refine(
		(value) =>
			Number.isFinite(Date.parse(`${value}T12:00:00Z`)) &&
			new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value,
		'Data inválida.',
	);
const sale = z
	.object({
		requestKey: key,
		customerId: z.uuid().optional(),
		notes: z.string().trim().max(2000).optional(),
		items: z
			.array(
				z.object({
					productId: z.uuid(),
					quantity: z.number().int().min(1).max(1_000_000),
				}),
			)
			.min(1)
			.max(100),
		installments: z
			.array(z.object({ dueDate: date, amountCents: positiveCents }))
			.min(1)
			.max(48),
		payment: payment.optional(),
	})
	.refine(
		(input) =>
			input.installments.every(
				(item, index) =>
					index === 0 || item.dueDate >= input.installments[index - 1]!.dueDate,
			),
		'As parcelas devem estar em ordem de vencimento.',
	);
const page = z.object({
	page: z.coerce.number().int().min(1).max(1_000_000).default(1),
	perPage: z.coerce.number().int().min(1).max(100).default(20),
	q: z.string().trim().max(160).optional(),
	customerId: z.uuid().optional(),
	status: z.enum(['COMPLETED', 'CANCELLED']).optional(),
});
const idParams = z.object({ id: z.uuid() });
type Request = FastifyRequest & {
	body: unknown;
	params: unknown;
	query: unknown;
};

// biome-ignore lint/suspicious/noExplicitAny: Existing HTTP layer uses Fastify structural types.
export async function salesRoutes(
	app: any,
	{ container }: { container: AppContainer },
) {
	const preHandler = async (
		request: FastifyRequest & { url: string },
		reply: unknown,
	) => {
		await authMiddleware(
			request,
			reply,
			container.jwtService,
			container.userRepository,
		);
		if (
			!['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'].includes(
				request.user!.role,
			)
		)
			throw new ForbiddenError('Acesso restrito à equipe da loja.');
		await storeContextMiddleware(request, reply, container.storeRepository!);
		const url = request.url.split('?')[0]!;

		if (url.startsWith('/receivables/') && container.planAccess) {
			const resolved = await container.planAccess.resolve(
				request.storeContext!.tenantId,
			);
			if (
				!resolved.features.find((feature) => feature.key === 'finance.cash')
					?.enabled
			)
				throw new ForbiddenError('O plano não permite recebimentos no caixa.');
		}
		container.featureFlags.assertEnabled('dashboard');
		container.featureFlags.assertEnabled(
			url.startsWith('/cash-register')
				? 'dashboard.cashRegister'
				: url.includes('/receivables') || url.includes('/payments')
					? 'dashboard.customers'
					: 'dashboard.orders',
		);
		if (!container.sales)
			throw new DomainError(
				'As operações de venda exigem persistência PostgreSQL configurada.',
			);
	};
	const scope = (request: FastifyRequest) => ({
		storeId: request.storeContext!.storeId,
		userId: request.storeContext!.userId,
	});
	const manager = (request: FastifyRequest) => {
		if (
			!['OWNER', 'ADMIN', 'MANAGER'].includes(request.storeContext!.role) ||
			!['ROLE_ADMIN', 'ROLE_MANAGER'].includes(request.user!.role)
		)
			throw new ForbiddenError(
				'Ação restrita à administração e gerência da filial.',
			);
	};
	const schema = {
		tags: ['sales'],
		security: [{ bearerAuth: [] }, { sessionCookie: [] }],
	};
	const options = (
		description: string,
		schemas: Parameters<typeof createRequestSchema>[0] = {},
	) => ({
		preHandler,
		schema: { ...schema, description, ...createRequestSchema(schemas) },
	});
	app.get(
		'/sales/orders',
		options('Lista pedidos de venda da filial', { query: page }),
		(r: Request) =>
			container.sales!.list(scope(r).storeId, page.parse(r.query)),
	);
	app.get(
		'/sales/orders/:id',
		options('Consulta pedido, itens, parcelas e recebimentos', {
			params: idParams,
		}),
		(r: Request) =>
			container.sales!.detail(scope(r).storeId, idParams.parse(r.params).id),
	);
	app.post(
		'/sales/orders',
		options('Conclui venda, baixa estoque e registra parcelas atomicamente', {
			body: sale,
		}),
		async (r: Request, reply: { code(code: number): void }) => {
			const input = sale.parse(r.body);
			if (input.payment)
				container.featureFlags.assertEnabled('dashboard.cashRegister');
			if (input.customerId)
				container.featureFlags.assertEnabled('dashboard.customers');
			// An order may also use cash and receivables: honor those plan capabilities.
			if (container.planAccess) {
				const resolved = await container.planAccess.resolve(
					r.storeContext!.tenantId,
				);
				const required = [
					'sales.orders',
					...(input.payment ? ['finance.cash'] : []),
					...(input.customerId ? ['finance.receivables'] : []),
				];
				if (
					required.some(
						(key) =>
							!resolved.features.find((feature) => feature.key === key)
								?.enabled,
					)
				)
					throw new ForbiddenError(
						'O plano não permite esta operação financeira.',
					);
			}
			const result = await container.sales!.create(scope(r), input);
			reply.code(201);
			return result;
		},
	);
	app.post(
		'/sales/orders/:id/cancel',
		options('Cancela pedido sem recebimentos, recompondo estoque', {
			params: idParams,
			body: z.object({ reason: z.string().trim().min(5).max(500) }),
		}),
		(r: Request) => {
			manager(r);
			return container.sales!.cancel(
				scope(r),
				idParams.parse(r.params).id,
				z.object({ reason: z.string().trim().min(5).max(500) }).parse(r.body)
					.reason,
			);
		},
	);
	app.get(
		'/customers/:id/receivables',
		options('Conta do cliente com parcelas, atraso e histórico de pagamentos', {
			params: idParams,
		}),
		(r: Request) =>
			container.sales!.account(scope(r).storeId, idParams.parse(r.params).id),
	);
	app.post(
		'/receivables/:id/payments',
		options('Registra pagamento parcial ou integral em caixa aberto', {
			params: idParams,
			body: payment.extend({ requestKey: key }),
		}),
		(r: Request) => {
			container.featureFlags.assertEnabled('dashboard.cashRegister');
			return container.sales!.pay(
				scope(r),
				idParams.parse(r.params).id,
				payment.extend({ requestKey: key }).parse(r.body),
			);
		},
	);
	app.get(
		'/cash-register',
		options('Consulta caixa aberto, saldo em dinheiro e fechamentos', {
			query: page,
		}),
		(r: Request) =>
			container.sales!.cash(scope(r).storeId, page.parse(r.query).page),
	);
	app.post(
		'/cash-register/open',
		options('Abre um único caixa por filial', {
			body: z.object({ openingCents: cents }),
		}),
		(r: Request) =>
			container.sales!.open(
				scope(r),
				z.object({ openingCents: cents }).parse(r.body).openingCents,
			),
	);
	const movement = z.object({
		requestKey: key,
		amountCents: positiveCents,
		kind: z.enum(['SUPPLY', 'WITHDRAWAL']),
		reason: z.string().trim().min(5).max(500),
	});
	app.post(
		'/cash-register/movements',
		options('Registra suprimento ou sangria com motivo e responsável', {
			body: movement,
		}),
		(r: Request) => {
			manager(r);
			return container.sales!.move(scope(r), movement.parse(r.body));
		},
	);
	const closing = z.object({
		countedCents: cents,
		notes: z.string().trim().max(2000).optional(),
	});
	app.post(
		'/cash-register/:id/close',
		options('Fecha caixa preservando saldo esperado, conferido e diferença', {
			params: idParams,
			body: closing,
		}),
		(r: Request) => {
			manager(r);
			const input = closing.parse(r.body);
			return container.sales!.close(
				scope(r),
				idParams.parse(r.params).id,
				input.countedCents,
				input.notes,
			);
		},
	);
}
