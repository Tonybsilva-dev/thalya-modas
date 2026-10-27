import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { SaveCustomerUseCase } from '../../../core/application/use-cases/customers';
import {
	createRequestSchema,
	createResponseSchema,
} from '../../../shared/utils/zod-to-json-schema';
import type { AppContainer } from '../container';
import { ForbiddenError } from '../errors/forbidden-error';
import { NotFoundError } from '../errors/not-found-error';
import { authMiddleware } from '../middlewares/auth';
import { storeContextMiddleware } from '../middlewares/store-context';

const optionalText = (max: number) => z.string().trim().max(max).optional();
const inputSchema = z.object({
	name: z.string().trim().min(2).max(160),
	email: z.union([z.email(), z.literal('')]).optional(),
	phone: optionalText(30),
	document: optionalText(30),
	notes: optionalText(2000),
	status: z.enum(['ACTIVE', 'INACTIVE']),
});
const createSchema = inputSchema.extend({
	status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});
const customerSchema = inputSchema.extend({
	id: z.uuid(),
	storeId: z.uuid(),
	createdAt: z.string(),
	updatedAt: z.string(),
});
const querySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	perPage: z.coerce.number().int().min(1).max(100).default(20),
	q: optionalText(160),
	status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
const paramsSchema = z.object({ id: z.uuid() });

// biome-ignore lint/suspicious/noExplicitAny: Existing HTTP layer uses Fastify structural types.
export async function customerRoutes(
	app: any,
	{ container }: { container: AppContainer },
) {
	const repository = container.customerRepository;
	if (!repository || !container.storeRepository)
		throw new Error('Customer repositories not configured');
	const save = new SaveCustomerUseCase(repository);
	const preHandler = async (request: FastifyRequest, reply: unknown) => {
		container.featureFlags.assertEnabled('dashboard.customers');
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
	};
	const schema = {
		tags: ['customers'],
		security: [{ bearerAuth: [] }, { sessionCookie: [] }],
	};
	app.get(
		'/customers',
		{
			preHandler,
			schema: {
				...schema,
				description:
					'Lista clientes comerciais da filial, sem exigir conta de login',
				querystring: createRequestSchema({ query: querySchema }).querystring,
				response: {
					200: createResponseSchema(
						z.object({
							items: z.array(customerSchema),
							total: z.number(),
							page: z.number(),
							perPage: z.number(),
							totalPages: z.number(),
						}),
						'Clientes da filial',
					),
				},
			},
		},
		async (request: FastifyRequest & { query: unknown }) =>
			repository.list(
				request.storeContext!.storeId,
				querySchema.parse(request.query),
			),
	);
	app.get(
		'/customers/:id',
		{
			preHandler,
			schema: {
				...schema,
				description: 'Consulta cliente na filial ativa',
				params: createRequestSchema({ params: paramsSchema }).params,
				response: { 200: createResponseSchema(customerSchema, 'Cliente') },
			},
		},
		async (request: FastifyRequest & { params: unknown }) => {
			const customer = await repository.find(
				request.storeContext!.storeId,
				paramsSchema.parse(request.params).id,
			);
			if (!customer)
				throw new NotFoundError('Cliente não encontrado nesta filial.');
			return customer;
		},
	);
	app.post(
		'/customers',
		{
			preHandler,
			schema: {
				...schema,
				description: 'Cadastra cliente comercial independente de usuário',
				body: createRequestSchema({ body: createSchema }).body,
				response: {
					201: createResponseSchema(customerSchema, 'Cliente criado'),
				},
			},
		},
		async (
			request: FastifyRequest & { body: unknown },
			reply: { code(code: number): void },
		) => {
			reply.code(201);
			return save.execute(
				request.storeContext!.storeId,
				createSchema.parse(request.body),
			);
		},
	);
	app.patch(
		'/customers/:id',
		{
			preHandler,
			schema: {
				...schema,
				description: 'Edita ou inativa cliente preservando histórico',
				params: createRequestSchema({ params: paramsSchema }).params,
				body: createRequestSchema({ body: inputSchema.partial() }).body,
				response: {
					200: createResponseSchema(customerSchema, 'Cliente atualizado'),
				},
			},
		},
		async (request: FastifyRequest & { params: unknown; body: unknown }) => {
			const id = paramsSchema.parse(request.params).id;
			const previous = await repository.find(request.storeContext!.storeId, id);
			if (!previous)
				throw new NotFoundError('Cliente não encontrado nesta filial.');
			return save.execute(
				request.storeContext!.storeId,
				{ ...previous, ...inputSchema.partial().parse(request.body) },
				id,
			);
		},
	);
}
