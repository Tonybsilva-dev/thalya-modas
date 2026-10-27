import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AccountStatus, UserRole } from '../../../core/domain';
import type { FindManyUsersParams } from '../../../core/domain/repositories/user-repository';
import { Name } from '../../../core/domain/value-objects/name';
import { parsePageRequest } from '../../../shared/pagination/helpers';
import {
	createRequestSchema,
	createResponseSchema,
} from '../../../shared/utils/zod-to-json-schema';
import { administrativeOperation } from '../administrative-operation';
import type { AppContainer } from '../container';
import { ForbiddenError } from '../errors/forbidden-error';
import { NotFoundError } from '../errors/not-found-error';
import { authMiddleware } from '../middlewares/auth';
import { storeContextMiddleware } from '../middlewares/store-context';
import { pageSchema, paginationQuery } from '../pagination';

const checkEmailQuerySchema = z.object({
	email: z.string().email('Email inválido'),
});

const paramsIdSchema = z.object({
	id: z.string().uuid(),
});

const patchUserBodySchema = z
	.object({
		name: z.string().min(1).optional(),
		email: z.string().email().optional(),
		role: z.nativeEnum(UserRole).optional(),
		accountStatus: z.nativeEnum(AccountStatus).optional(),
	})
	.strict();

/** Schema JSON explícito para documentação Swagger – listagem paginada (GET /users). */
const listUsersQuerystringJsonSchema = {
	type: 'object' as const,
	properties: {
		page: {
			type: 'string' as const,
			description: 'Número da página (default: 1)',
		},
		perPage: {
			type: 'string' as const,
			description: 'Itens por página, 1-100 (default: 10)',
		},
		sort: {
			type: 'string' as const,
			description: 'Ordenação (ex.: asc, desc)',
		},
		filter: {
			type: 'string' as const,
			description: 'Filtro por nome ou email',
		},
	},
};

const userItemJsonSchema = {
	type: 'object' as const,
	properties: {
		id: { type: 'string' as const, format: 'uuid' },
		name: { type: 'string' as const },
		email: { type: 'string' as const, format: 'email' },
		role: { type: 'string' as const },
		accountStatus: { type: 'string' as const },
		createdAt: { type: 'string' as const, format: 'date-time' },
		updatedAt: { type: 'string' as const, format: 'date-time' },
	},
};

const listUsersResponseJsonSchema = {
	type: 'object' as const,
	required: ['items', 'total', 'page', 'perPage', 'totalPages'],
	properties: {
		items: {
			type: 'array' as const,
			items: userItemJsonSchema,
			description: 'Lista de usuários da página',
		},
		total: { type: 'integer' as const, description: 'Total de registros' },
		page: { type: 'integer' as const, description: 'Página atual' },
		perPage: { type: 'integer' as const, description: 'Itens por página' },
		totalPages: { type: 'integer' as const, description: 'Total de páginas' },
	},
};

const forbiddenResponseJsonSchema = {
	type: 'object' as const,
	properties: {
		error: { type: 'string' as const, example: 'ForbiddenError' },
		message: { type: 'string' as const, example: 'Sem permissão' },
		traceId: { type: 'string' as const, format: 'uuid' },
	},
};

const notFoundResponseJsonSchema = {
	type: 'object' as const,
	properties: {
		error: { type: 'string' as const, example: 'NotFoundError' },
		message: { type: 'string' as const, example: 'Usuário não encontrado' },
		traceId: { type: 'string' as const, format: 'uuid' },
	},
};

/** Parâmetro de path :id para documentação Swagger (GET/PATCH/DELETE /users/:id). */
const paramsIdJsonSchema = {
	type: 'object' as const,
	required: ['id'],
	properties: {
		id: {
			type: 'string' as const,
			format: 'uuid',
			description: 'ID do usuário',
		},
	},
};

/** Schema JSON explícito para documentação Swagger (evita body/response vazios no OpenAPI). */
const patchUserBodyJsonSchema = {
	type: 'object' as const,
	properties: {
		name: {
			type: 'string' as const,
			minLength: 1,
			description: 'Nome do usuário',
		},
		email: {
			type: 'string' as const,
			format: 'email',
			description: 'Email do usuário',
		},
		role: {
			type: 'string' as const,
			enum: Object.values(UserRole),
			description: 'Papel do usuário',
		},
		accountStatus: {
			type: 'string' as const,
			enum: Object.values(AccountStatus),
			description: 'Status da conta',
		},
	},
	additionalProperties: false,
};

function toUserResponse(user: {
	id: string;
	name: string;
	email: string;
	role: string;
	accountStatus: string;
	createdAt: Date;
	updatedAt: Date;
}) {
	return {
		...user,
		createdAt: user.createdAt.toISOString(),
		updatedAt: user.updatedAt.toISOString(),
	};
}

function canListUsers(role: string): boolean {
	return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN;
}

function canManageUser(role: string): boolean {
	return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN;
}

export async function userRoutes(
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tipos
	fastify: any,
	options: { container: AppContainer },
) {
	const { container } = options;

	if (!container.userRepository) {
		return;
	}

	const repo = container.userRepository;

	async function scopedUserIds(
		request: FastifyRequest,
	): Promise<string[] | undefined> {
		if (request.user?.role === UserRole.SUPER_ADMIN) return undefined;
		if (request.user?.role !== UserRole.ADMIN || !container.storeRepository)
			throw new ForbiddenError('Acesso administrativo negado.');
		await storeContextMiddleware(request, {}, container.storeRepository);
		if (
			!request.storeContext ||
			!['OWNER', 'ADMIN'].includes(request.storeContext.role)
		)
			throw new ForbiddenError('Administracao da loja negada.');
		return container.storeRepository.findTenantUserIds(
			request.storeContext.tenantId,
		);
	}
	async function assertTargetAccess(
		request: FastifyRequest,
		id: string,
		mutation = false,
	) {
		if (request.user?.role === UserRole.SUPER_ADMIN) return;
		if (id === request.user?.userId && !mutation) return;
		const ids = await scopedUserIds(request);
		if (!ids?.includes(id))
			throw new ForbiddenError('Usuario fora da loja ativa.');
		if (mutation) {
			const target = await repo.findById(id);
			if (
				!target ||
				![UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.CUSTOMER].includes(
					target.role,
				)
			)
				throw new ForbiddenError(
					'Admin gerencia apenas funcionarios e clientes.',
				);
			const stores =
				await container.storeRepository?.findAssociatedTenantIds(id);
			if (stores?.length !== 1)
				throw new ForbiddenError(
					'Conta compartilhada: alteracao global exige Super Admin.',
				);
		}
	}

	fastify.get(
		'/admin/stores',
		{
			schema: { ...pageSchema, tags: ['platform'] },
			preHandler: async (request: FastifyRequest, reply: unknown) => {
				await authMiddleware(
					request,
					reply,
					container.jwtService,
					container.userRepository,
				);
				if (request.user?.role !== UserRole.SUPER_ADMIN)
					throw new ForbiddenError('Administracao global exige Super Admin.');
			},
		},
		async (request: FastifyRequest & { query: unknown }) => {
			const query = paginationQuery.parse(request.query);
			return container.storeRepository!.findStoresPage(query);
		},
	);

	fastify.get(
		'/users/check-email',
		{
			config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
			schema: {
				description:
					'Verifica se um email está disponível para registro (não está em uso)',
				tags: ['users'],
				querystring: createRequestSchema({
					query: checkEmailQuerySchema,
				}).querystring,
				response: {
					200: createResponseSchema(
						z.object({ available: z.boolean() }),
						'Disponibilidade do email',
						{ available: true },
					),
				},
			},
		},
		async (request: { query: { email: string } }) => {
			const { email } = checkEmailQuerySchema.parse(request.query);
			const existing = await repo.findByEmail(email);
			return { available: !existing };
		},
	);

	fastify.get(
		'/users',
		{
			schema: {
				description:
					'Lista usuários com paginação. Apenas Super Admin e Admin.',
				tags: ['users'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				querystring: listUsersQuerystringJsonSchema,
				response: {
					200: {
						description: 'Lista paginada de usuários',
						...listUsersResponseJsonSchema,
						example: {
							items: [
								{
									id: '123e4567-e89b-12d3-a456-426614174000',
									name: 'João Silva',
									email: 'joao@example.com',
									role: 'ROLE_CUSTOMER',
									accountStatus: 'ACTIVE',
									createdAt: '2024-01-01T00:00:00.000Z',
									updatedAt: '2024-01-01T00:00:00.000Z',
								},
							],
							total: 1,
							page: 1,
							perPage: 10,
							totalPages: 1,
						},
					},
					403: {
						description: 'Sem permissão',
						...forbiddenResponseJsonSchema,
						example: {
							error: 'ForbiddenError',
							message: 'Apenas Super Admin e Admin podem listar usuários.',
						},
					},
				},
			},
			preHandler: async (req: FastifyRequest, _reply: unknown) => {
				await authMiddleware(
					req,
					_reply,
					container.jwtService,
					container.userRepository,
				);
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tipos
		async (request: any) => {
			const user = request.user as { userId: string; role: string };
			if (!canListUsers(user.role)) {
				throw new ForbiddenError(
					'Apenas Super Admin e Admin podem listar usuários.',
				);
			}
			const pageRequest = parsePageRequest(request.query || {});
			const params: FindManyUsersParams = {
				...pageRequest,
				userIds: await scopedUserIds(request),
			};
			const usersPage = await repo.findMany(params);

			return {
				...usersPage,
				items: usersPage.items.map((u) => toUserResponse(u)),
			};
		},
	);

	const countUsersQuerySchema = z.object({
		filter: z.string().optional(),
	});

	fastify.get(
		'/users/count',
		{
			schema: {
				description:
					'Retorna o total de usuários (com filtro opcional em nome/email). Apenas Super Admin e Admin.',
				tags: ['users'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				querystring: createRequestSchema({
					query: countUsersQuerySchema,
				}).querystring,
				response: {
					200: createResponseSchema(
						z.object({ count: z.number() }),
						'Total de usuários',
						{ count: 0 },
					),
					403: createResponseSchema(
						z.object({
							error: z.string(),
							message: z.string(),
							traceId: z.string().optional(),
						}),
						'Sem permissão',
					),
				},
			},
			preHandler: async (req: FastifyRequest, _reply: unknown) => {
				await authMiddleware(
					req,
					_reply,
					container.jwtService,
					container.userRepository,
				);
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tipos
		async (request: any) => {
			const user = request.user as { userId: string; role: string };
			if (!canListUsers(user.role)) {
				throw new ForbiddenError(
					'Apenas Super Admin e Admin podem consultar a contagem de usuários.',
				);
			}
			const { filter } = countUsersQuerySchema.parse(request.query || {});
			const count = await repo.count(filter, await scopedUserIds(request));
			return { count };
		},
	);

	fastify.get(
		'/users/:id',
		{
			schema: {
				description:
					'Obtém um usuário por ID. Próprio perfil ou Super Admin/Admin.',
				tags: ['users'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				params: paramsIdJsonSchema,
				response: {
					200: {
						description: 'Usuário encontrado',
						...userItemJsonSchema,
						example: {
							id: '123e4567-e89b-12d3-a456-426614174000',
							name: 'João Silva',
							email: 'joao@example.com',
							role: 'ROLE_CUSTOMER',
							accountStatus: 'ACTIVE',
							createdAt: '2024-01-01T00:00:00.000Z',
							updatedAt: '2024-01-01T00:00:00.000Z',
						},
					},
					403: {
						description: 'Sem permissão',
						...forbiddenResponseJsonSchema,
						example: {
							error: 'ForbiddenError',
							message: 'Você só pode visualizar seu próprio perfil.',
						},
					},
					404: {
						description: 'Usuário não encontrado',
						...notFoundResponseJsonSchema,
						example: {
							error: 'NotFoundError',
							message: 'Usuário não encontrado',
						},
					},
				},
			},
			preHandler: async (req: FastifyRequest, _reply: unknown) => {
				await authMiddleware(
					req,
					_reply,
					container.jwtService,
					container.userRepository,
				);
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tipos
		async (request: any) => {
			const { id } = paramsIdSchema.parse(request.params);
			const authUser = request.user as { userId: string; role: string };
			if (id !== authUser.userId && !canManageUser(authUser.role)) {
				throw new ForbiddenError('Você só pode visualizar seu próprio perfil.');
			}
			await assertTargetAccess(request, id);
			const user = await repo.findById(id);
			if (!user) {
				throw new NotFoundError('Usuário não encontrado');
			}
			return toUserResponse(user);
		},
	);

	fastify.patch(
		'/users/:id',
		{
			schema: {
				description:
					'Atualiza parcialmente um usuário. Próprio perfil (nome) ou Super Admin/Admin.',
				tags: ['users'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				params: paramsIdJsonSchema,
				body: {
					...patchUserBodyJsonSchema,
					example: {
						name: 'Maria Silva',
						email: 'maria@example.com',
					},
				},
				response: {
					200: {
						description: 'Usuário atualizado',
						...userItemJsonSchema,
						example: {
							id: '123e4567-e89b-12d3-a456-426614174000',
							name: 'Maria Silva',
							email: 'maria@example.com',
							role: 'ROLE_CUSTOMER',
							accountStatus: 'ACTIVE',
							createdAt: '2024-01-01T00:00:00.000Z',
							updatedAt: '2024-01-01T00:00:00.000Z',
						},
					},
					403: {
						description: 'Sem permissão',
						...forbiddenResponseJsonSchema,
						example: {
							error: 'ForbiddenError',
							message: 'Usuário comum só pode atualizar o próprio nome.',
						},
					},
					404: {
						description: 'Usuário não encontrado',
						...notFoundResponseJsonSchema,
						example: {
							error: 'NotFoundError',
							message: 'Usuário não encontrado',
						},
					},
				},
			},
			preHandler: async (req: FastifyRequest, _reply: unknown) => {
				await authMiddleware(
					req,
					_reply,
					container.jwtService,
					container.userRepository,
				);
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tipos
		async (request: any) => {
			const { id } = paramsIdSchema.parse(request.params);
			const authUser = request.user as { userId: string; role: string };
			const body = patchUserBodySchema.parse(request.body || {});

			if (id !== authUser.userId && !canManageUser(authUser.role)) {
				throw new ForbiddenError(
					'Você só pode atualizar seu próprio perfil (nome).',
				);
			}
			if (id === authUser.userId && !canManageUser(authUser.role)) {
				const allowedKeys = ['name'];
				for (const key of Object.keys(body)) {
					if (!allowedKeys.includes(key)) {
						throw new ForbiddenError(
							'Usuário comum só pode atualizar o próprio nome.',
						);
					}
				}
			}

			if (authUser.role !== UserRole.SUPER_ADMIN) {
				if (id === authUser.userId) {
					if (Object.keys(body).some((key) => key !== 'name'))
						throw new ForbiddenError(
							'O proprio perfil permite alterar apenas o nome.',
						);
				} else {
					await assertTargetAccess(request, id, true);
					if (
						body.role &&
						![UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.CUSTOMER].includes(
							body.role,
						)
					)
						throw new ForbiddenError(
							'Promocao administrativa exige Super Admin.',
						);
				}
			}
			const existing = await repo.findById(id);
			if (!existing) {
				throw new NotFoundError('Usuário não encontrado');
			}

			const toUpdate = { ...body };
			if (
				(body.role && body.role !== existing.role) ||
				(body.accountStatus && body.accountStatus !== existing.accountStatus) ||
				(body.email && body.email !== existing.email)
			)
				await container.security.revokeAll(id);
			if (typeof body.name === 'string' && body.name.length > 0) {
				toUpdate.name = Name.fromRaw(body.name).value;
			}

			if (authUser.role === UserRole.SUPER_ADMIN && container.planAccess) {
				return administrativeOperation(
					container,
					async ({ users, stores, audit }) => {
						const prior = await users.findById(id);
						const updated = await users.update(id, toUpdate);
						if (!updated || !prior)
							throw new NotFoundError('Usuário não encontrado');
						if (body.role)
							await stores.updateMemberRoles(
								id,
								body.role.replace('ROLE_', ''),
							);
						const snapshot = (user: typeof updated) => ({
							name: user.name,
							email: user.email,
							role: user.role,
							accountStatus: user.accountStatus,
						});
						await audit.recordAudit({
							actorId: authUser.userId,
							action: 'USER_UPDATED',
							targetId: id,
							reason: 'Atualização administrativa de usuário',
							changes: { before: snapshot(prior), after: snapshot(updated) },
						});
						return toUserResponse(updated);
					},
				);
			}
			const updated = await repo.update(id, toUpdate);
			if (!updated) {
				throw new NotFoundError('Usuário não encontrado');
			}
			if (body.role)
				await container.storeRepository?.updateMemberRoles(
					id,
					body.role.replace('ROLE_', ''),
				);
			return toUserResponse(updated);
		},
	);

	fastify.delete(
		'/users/:id',
		{
			schema: {
				description:
					'Remove um usuário. Apenas Super Admin e Admin (ou próprio usuário).',
				tags: ['users'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				params: paramsIdJsonSchema,
				response: {
					204: { type: 'null', description: 'Usuário removido' },
					403: {
						description: 'Sem permissão',
						...forbiddenResponseJsonSchema,
						example: {
							error: 'ForbiddenError',
							message: 'Apenas Super Admin e Admin podem excluir usuários.',
						},
					},
					404: {
						description: 'Usuário não encontrado',
						...notFoundResponseJsonSchema,
						example: {
							error: 'NotFoundError',
							message: 'Usuário não encontrado',
						},
					},
				},
			},
			preHandler: async (req: FastifyRequest, _reply: unknown) => {
				await authMiddleware(
					req,
					_reply,
					container.jwtService,
					container.userRepository,
				);
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tipos
		async (request: any, reply: any) => {
			const { id } = paramsIdSchema.parse(request.params);
			const authUser = request.user as { userId: string; role: string };
			if (id !== authUser.userId && !canManageUser(authUser.role)) {
				throw new ForbiddenError(
					'Apenas Super Admin e Admin podem excluir usuários.',
				);
			}
			if (authUser.role !== UserRole.SUPER_ADMIN) {
				if (id === authUser.userId)
					throw new ForbiddenError(
						'Exclusao da propria conta exige administracao global.',
					);
				await assertTargetAccess(request, id, true);
			}
			if (
				(await container.storeRepository?.findAllTenants())?.some(
					(tenant) => tenant.ownerId === id,
				)
			)
				throw new ForbiddenError(
					'Proprietario de empresa nao pode ser excluido; suspenda a conta.',
				);
			const existed = await repo.delete(id);
			if (!existed) {
				throw new NotFoundError('Usuário não encontrado');
			}
			return reply.code(204).send();
		},
	);
}
