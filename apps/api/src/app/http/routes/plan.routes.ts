import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
	catalogKeys,
	DEFAULT_PLAN_ID,
	featureCatalog,
} from '../../../core/domain/feature-catalog';
import type { AppContainer } from '../container';
import { ForbiddenError } from '../errors/forbidden-error';
import { NotFoundError } from '../errors/not-found-error';
import { authMiddleware } from '../middlewares/auth';
import { storeContextMiddleware } from '../middlewares/store-context';
import { pageSchema, paginationQuery } from '../pagination';

const flagsSchema = z
	.record(z.string(), z.boolean())
	.refine(
		(flags) => Object.keys(flags).every((key) => catalogKeys.includes(key)),
		'Funcionalidade ou módulo desconhecido.',
	);
const planInput = z
	.object({
		name: z.string().trim().min(2).max(100),
		description: z.string().max(1000).default(''),
		status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
		priceCents: z.number().int().nonnegative().nullable().default(null),
		flags: flagsSchema,
		reason: z.string().trim().min(5).max(500),
	})
	.strict();
const idSchema = z.object({ id: z.string().uuid() });
type Request = FastifyRequest & { params: unknown; body: unknown };
export async function planRoutes(
	// biome-ignore lint/suspicious/noExplicitAny: Fastify declaration compatibility.
	app: any,
	{ container }: { container: AppContainer },
) {
	const service = container.planAccess;
	if (!service) return;
	const repo = service.repository;
	const authenticate = async (request: FastifyRequest, reply: unknown) => {
		await authMiddleware(
			request,
			reply,
			container.jwtService,
			container.userRepository,
		);
		if (request.user?.role !== 'ROLE_SUPER_ADMIN')
			throw new ForbiddenError('Administração de planos exige SUPER_ADMIN.');
	};
	const options = {
		preHandler: authenticate,
		schema: {
			tags: ['platform'],
			security: [{ sessionCookie: [] }, { bearerAuth: [] }],
		},
	};
	app.get('/admin/features', options, async () => featureCatalog);
	app.get(
		'/admin/analytics',
		options,
		async (request: FastifyRequest & { query: unknown }) => {
			const stores = container.storeRepository!;
			const query = paginationQuery.parse(request.query);
			const [summary, plans, controls] = await Promise.all([
				stores.getPlatformSummary(),
				repo.findPlansPage(query),
				repo.getControls(),
			]);
			const distribution = await Promise.all(
				plans.items.map(async (plan) => ({
					id: plan.id,
					name: plan.name,
					status: plan.status,
					priceCents: plan.priceCents,
					tenants: await repo.assignedCount(plan.id),
				})),
			);
			return {
				summary,
				plans: { ...plans, items: distribution },
				controls,
				generatedAt: new Date().toISOString(),
			};
		},
	);
	app.get(
		'/operations/plan',
		{
			...options,
			preHandler: async (request: FastifyRequest, reply: unknown) => {
				await authMiddleware(
					request,
					reply,
					container.jwtService,
					container.userRepository,
				);
				await storeContextMiddleware(
					request,
					reply,
					container.storeRepository!,
				);
			},
		},
		async (request: FastifyRequest) => {
			const result = await service.resolve(request.storeContext!.tenantId);
			// Tenant-facing contract does not expose raw overrides or platform-wide switches.
			return {
				tenantId: request.storeContext!.tenantId,
				plan: result.plan
					? {
							id: result.plan.id,
							name: result.plan.name,
							description: result.plan.description,
							status: result.plan.status,
						}
					: null,
				maintenance: result.controls.maintenance,
				features: result.features,
			};
		},
	);
	app.get('/admin/audit/actors', options, async () => {
		const ids = await repo.listAuditActorIds();
		return Promise.all(
			ids.map(async (id) => ({
				id,
				name:
					(await container.userRepository?.findById(id))?.name ??
					'Conta removida',
			})),
		);
	});
	app.get(
		'/admin/audit',
		options,
		async (request: FastifyRequest & { query: unknown }) => {
			const query = z
				.object({
					page: z.coerce.number().int().min(1).max(100000).default(1),
					perPage: z.coerce.number().int().min(1).max(100).default(20),
					action: z.string().max(100).optional(),
					actorId: z.string().uuid().optional(),
					targetId: z.string().uuid().or(z.literal('global')).optional(),
					from: z.iso
						.datetime({ offset: true })
						.transform((value) => new Date(value))
						.optional(),
					to: z.iso
						.datetime({ offset: true })
						.transform((value) => new Date(value))
						.optional(),
				})
				.strict()
				.refine((q) => !q.from || !q.to || q.from <= q.to, 'Periodo invalido.')
				.parse(request.query);
			const result = await repo.findAudit(query);
			const names = new Map(
				await Promise.all(
					[...new Set(result.items.map((row) => row.actorId))].map(
						async (id) =>
							[
								id,
								(await container.userRepository?.findById(id))?.name ??
									'Conta removida',
							] as const,
					),
				),
			);
			return {
				...result,
				items: result.items.map((row) => ({
					...row,
					actorName: names.get(row.actorId),
				})),
			};
		},
	);
	app.get(
		'/admin/plans',
		{ ...options, schema: { ...options.schema, ...pageSchema } },
		async (request: FastifyRequest & { query: unknown }) =>
			repo.findPlansPage(
				paginationQuery
					.extend({
						status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
					})
					.parse(request.query),
			),
	);
	app.get(
		'/admin/plans/:id',
		options,
		async (request: FastifyRequest & { params: unknown }) => {
			const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
			const plan = await repo.findPlan(id);
			if (!plan) throw new ForbiddenError('Plano indisponivel.');
			return plan;
		},
	);
	app.post(
		'/admin/plans',
		options,
		async (
			request: Request,
			reply: { code(code: number): { send(value: unknown): unknown } },
		) => {
			const { reason, ...input } = planInput.parse(request.body);
			return reply.code(201).send(
				await repo.savePlan(undefined, input, {
					actorId: request.user!.userId,
					action: 'PLAN_CREATED',
					targetId: 'new',
					reason,
					changes: input,
				}),
			);
		},
	);
	app.patch('/admin/plans/:id', options, async (request: Request) => {
		const { id } = idSchema.parse(request.params);
		const prior = await repo.findPlan(id);
		if (!prior) throw new NotFoundError('Plano não encontrado.');
		const { reason, ...input } = planInput.parse(request.body);
		if (
			input.status !== 'PUBLISHED' &&
			(id === DEFAULT_PLAN_ID || (await repo.assignedCount(id)) > 0)
		)
			throw new ForbiddenError(
				'Um plano padrão ou em uso deve permanecer publicado.',
			);
		return repo.savePlan(id, input, {
			actorId: request.user!.userId,
			action: 'PLAN_UPDATED',
			targetId: id,
			reason,
			changes: { before: prior, after: input },
		});
	});
	app.get('/admin/controls', options, async () => repo.getControls());
	app.patch('/admin/controls', options, async (request: Request) => {
		const body = z
			.object({
				disabledKeys: z
					.array(z.string())
					.refine(
						(keys) => keys.every((key) => catalogKeys.includes(key)),
						'Chave desconhecida.',
					),
				maintenance: z.boolean(),
				reason: z.string().trim().min(5).max(500),
			})
			.strict()
			.parse(request.body);
		const before = await repo.getControls();
		return repo.setControls(
			{
				disabledKeys: [...new Set(body.disabledKeys)],
				maintenance: body.maintenance,
			},
			{
				actorId: request.user!.userId,
				action: 'CONTROLS_UPDATED',
				targetId: 'global',
				reason: body.reason,
				changes: { before, after: body },
			},
		);
	});
	app.get('/admin/plan-audit', options, async () => {
		const rows = await repo.listAudit();
		const actors = await Promise.all(
			[...new Set(rows.map((row) => row.actorId))].map(
				async (id) =>
					[
						id,
						(await container.userRepository?.findById(id))?.name ??
							'Conta removida',
					] as const,
			),
		);
		const names = new Map(actors);
		return rows.map((row) => ({ ...row, actorName: names.get(row.actorId) }));
	});
	app.get('/admin/tenants/:id/plan', options, async (request: Request) => {
		const { id } = idSchema.parse(request.params);
		if (!(await container.storeRepository?.findTenantById(id)))
			throw new NotFoundError('Empresa não encontrada.');
		return service.resolve(id);
	});
	app.patch('/admin/tenants/:id/plan', options, async (request: Request) => {
		const { id } = idSchema.parse(request.params);
		if (!(await container.storeRepository?.findTenantById(id)))
			throw new NotFoundError('Empresa não encontrada.');
		const { reason, ...input } = z
			.object({
				planId: z.string().uuid(),
				overrides: flagsSchema,
				reason: z.string().trim().min(5).max(500),
			})
			.strict()
			.parse(request.body);
		if ((await repo.findPlan(input.planId))?.status !== 'PUBLISHED')
			throw new ForbiddenError('Selecione um plano publicado.');
		const before = await repo.getTenantPlan(id);
		await repo.setTenantPlan(id, input, {
			actorId: request.user!.userId,
			action: 'TENANT_PLAN_UPDATED',
			targetId: id,
			reason,
			changes: { before, after: input },
		});
		return service.resolve(id);
	});
}
