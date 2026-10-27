import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
	StoreSegment,
	StoreStatus,
	TenantStatus,
	UserRole,
} from '../../../core/domain';
import {
	createStoreBucketKey,
	normalizeStoreSlug,
} from '../../../core/domain/value-objects/store-slug';
import { administrativeOperation } from '../administrative-operation';
import type { AppContainer } from '../container';
import { ForbiddenError } from '../errors/forbidden-error';
import { authMiddleware } from '../middlewares/auth';
import { storeContextMiddleware } from '../middlewares/store-context';
import { pageSchema, paginationQuery } from '../pagination';

type TenantRequest = FastifyRequest & {
	params: unknown;
	body: unknown;
	query: unknown;
};
type TenantReply = { code(status: number): { send(value: unknown): unknown } };
export async function tenantRoutes(
	// biome-ignore lint/suspicious/noExplicitAny: same Fastify declaration compatibility as existing routes.
	server: any,
	{ container }: { container: AppContainer },
) {
	const repository = container.storeRepository;
	if (!repository || !container.userRepository) return;
	const params = z.object({ tenantId: z.string().uuid() });
	const authenticate = async (request: FastifyRequest, reply: unknown) => {
		await authMiddleware(
			request,
			reply,
			container.jwtService,
			container.userRepository,
		);
		if (
			![
				UserRole.SUPER_ADMIN,
				UserRole.ADMIN,
				UserRole.MANAGER,
				UserRole.EMPLOYEE,
			].includes(request.user!.role as UserRole)
		) {
			throw new ForbiddenError('Acesso empresarial negado.');
		}
	};

	server.get(
		'/operations/store',
		{ preHandler: authenticate },
		async (request: TenantRequest) => {
			await storeContextMiddleware(request, {}, repository);
			return repository.findById(request.storeContext!.storeId);
		},
	);
	server.patch(
		'/operations/store',
		{ preHandler: authenticate },
		async (request: TenantRequest) => {
			await storeContextMiddleware(request, {}, repository);
			if (
				request.user!.role !== UserRole.ADMIN ||
				!['OWNER', 'ADMIN'].includes(request.storeContext!.role)
			)
				throw new ForbiddenError('Somente o administrador altera a filial.');
			const input = z
				.object({
					name: z.string().trim().min(2).max(200),
					phone: z.string().trim().min(10).max(20),
				})
				.strict()
				.parse(request.body);
			return repository.update(request.storeContext!.storeId, input);
		},
	);
	async function authorize(request: TenantRequest, manage = false) {
		const { tenantId } = params.parse(request.params);
		const tenant = await repository!.findTenantById(tenantId);
		if (!tenant) throw new ForbiddenError('Empresa indisponível.');
		if (request.user!.role === UserRole.SUPER_ADMIN) return tenant;
		const access = (
			await repository!.findTenantsByUserId(request.user!.userId)
		).find((a) => a.tenant.id === tenantId);
		if (
			!access ||
			tenant.status !== TenantStatus.ACTIVE ||
			(manage &&
				(access.role !== 'ADMIN' || request.user!.role !== UserRole.ADMIN))
		) {
			throw new ForbiddenError('Acesso à empresa negado.');
		}
		return tenant;
	}

	server.get(
		'/admin/tenants/:tenantId/users',
		{ preHandler: authenticate, schema: { ...pageSchema, tags: ['platform'] } },
		async (request: TenantRequest) => {
			if (request.user!.role !== UserRole.SUPER_ADMIN)
				throw new ForbiddenError('Acesso exclusivo do SUPER_ADMIN.');
			const tenant = await authorize(request);
			const result = await repository.findTenantUserIdsPage(
				tenant.id,
				paginationQuery.parse(request.query),
			);
			const ids = result.items;
			const members = await Promise.all(
				ids.map((id) => container.userRepository!.findById(id)),
			);
			return {
				...result,
				items: members
					.filter((user) => user !== null)
					.map((user) => ({
						id: user.id,
						name: user.name,
						email: user.email,
						role: user.role,
						accountStatus: user.accountStatus,
					})),
			};
		},
	);
	server.get(
		'/tenants',
		{ preHandler: authenticate, schema: { ...pageSchema, tags: ['platform'] } },
		async (request: TenantRequest) => {
			const query = paginationQuery
				.extend({ status: z.nativeEnum(TenantStatus).optional() })
				.parse(request.query);
			return repository.findTenantsPage({
				...query,
				userId:
					request.user!.role === UserRole.SUPER_ADMIN
						? undefined
						: request.user!.userId,
			});
		},
	);
	server.post(
		'/tenants',
		{ preHandler: authenticate },
		async (request: TenantRequest, reply: TenantReply) => {
			const body = z
				.object({
					name: z.string().trim().min(2),
					ownerId: z.string().uuid().optional(),
				})
				.strict()
				.parse(request.body);
			if (
				request.user!.role !== UserRole.SUPER_ADMIN &&
				(request.user!.role !== UserRole.ADMIN || body.ownerId)
			) {
				throw new ForbiddenError(
					'Somente ADMIN cria sua empresa; definir proprietário exige SUPER_ADMIN.',
				);
			}
			const ownerId = body.ownerId ?? request.user!.userId;
			const owner = await container.userRepository!.findById(ownerId);
			if (
				!owner ||
				owner.role !== UserRole.ADMIN ||
				owner.accountStatus !== 'ACTIVE'
			)
				throw new ForbiddenError('O proprietário deve ser um ADMIN ativo.');
			const created = await administrativeOperation(
				container,
				async ({ stores, audit }) => {
					const created = await stores.createTenant({
						name: body.name,
						ownerId,
						slug: `${normalizeStoreSlug(body.name)}-${crypto.randomUUID()}`,
					});
					await audit.recordAudit({
						actorId: request.user!.userId,
						action: 'TENANT_CREATED',
						targetId: created.id,
						reason: 'Cadastro de empresa',
						changes: { after: created },
					});
					return created;
				},
			);
			return reply.code(201).send(created);
		},
	);
	server.get(
		'/tenants/:tenantId',
		{ preHandler: authenticate },
		(request: TenantRequest) => authorize(request),
	);
	server.patch(
		'/tenants/:tenantId',
		{ preHandler: authenticate },
		async (request: TenantRequest) => {
			const tenant = await authorize(request, true);
			const body = z
				.object({
					name: z.string().trim().min(2).optional(),
					status: z.nativeEnum(TenantStatus).optional(),
					reason: z.string().trim().min(5).max(500).optional(),
				})
				.strict()
				.parse(request.body);
			if (body.status && request.user!.role !== UserRole.SUPER_ADMIN)
				throw new ForbiddenError(
					'Somente SUPER_ADMIN altera o status da empresa.',
				);
			const { reason, ...input } = body;
			return administrativeOperation(container, async ({ stores, audit }) => {
				const before = await stores.findTenantById(tenant.id);
				const updated = await stores.updateTenant(tenant.id, input);
				await audit.recordAudit({
					actorId: request.user!.userId,
					action: 'TENANT_UPDATED',
					targetId: tenant.id,
					reason: reason ?? 'Atualização da empresa',
					changes: { before, after: updated },
				});
				return updated;
			});
		},
	);
	server.get(
		'/tenants/:tenantId/stores',
		{ preHandler: authenticate, schema: { ...pageSchema, tags: ['platform'] } },
		async (request: TenantRequest) => {
			const tenant = await authorize(request);
			const query = paginationQuery
				.extend({ status: z.nativeEnum(StoreStatus).optional() })
				.parse(request.query);
			return repository.findStoresPage({
				...query,
				tenantId: tenant.id,
				userId:
					request.user!.role === UserRole.SUPER_ADMIN
						? undefined
						: request.user!.userId,
			});
		},
	);
	server.post(
		'/tenants/:tenantId/stores',
		{ preHandler: authenticate },
		async (request: TenantRequest, reply: TenantReply) => {
			const tenant = await authorize(request, true);
			const body = z
				.object({
					name: z.string().trim().min(2),
					phone: z.string().min(10),
					document: z.string().min(11),
					segment: z.nativeEnum(StoreSegment),
				})
				.strict()
				.parse(request.body);
			const slug = `${normalizeStoreSlug(body.name).slice(0, 26)}-${crypto.randomUUID()}`;
			const created = await administrativeOperation(
				container,
				async ({ stores, audit }) => {
					const created = await stores.create({
						...body,
						tenantId: tenant.id,
						ownerId: tenant.ownerId,
						slug,
						bucketKey: createStoreBucketKey(slug),
						status: StoreStatus.ACTIVE,
					});
					await audit.recordAudit({
						actorId: request.user!.userId,
						action: 'BRANCH_CREATED',
						targetId: tenant.id,
						reason: 'Cadastro de filial',
						changes: { branchId: created.id, after: created },
					});
					return created;
				},
			);
			return reply.code(201).send(created);
		},
	);
}
