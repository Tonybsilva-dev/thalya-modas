import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
	GetCurrentUserUseCase,
	LoginUseCase,
	RegisterUserUseCase,
} from '../../../core/application/use-cases/auth';
import { AccountStatus, UserRole } from '../../../core/domain';
import {
	createRequestSchema,
	createResponseSchema,
} from '../../../shared/utils/zod-to-json-schema';
import type { AppContainer } from '../container';
import { authMiddleware } from '../middlewares/auth';

// Schemas para requisições
const registerRequestSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
	email: z.string().email('Email inválido'),
	password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
	role: z.nativeEnum(UserRole).optional(),
	accountStatus: z.nativeEnum(AccountStatus).optional(),
});

const loginRequestSchema = z.object({
	email: z.string().email('Email inválido'),
	password: z.string().min(1, 'Senha é obrigatória'),
});

// Schemas para respostas
const registerResponseSchema = z.object({
	user: z.object({
		id: z.string().uuid(),
		name: z.string(),
		email: z.string().email(),
		role: z.string(),
		accountStatus: z.string(),
		createdAt: z.string().datetime(),
		updatedAt: z.string().datetime(),
	}),
	token: z.string(),
});

const loginResponseSchema = z.object({
	user: z.object({
		id: z.string().uuid(),
		name: z.string(),
		email: z.string().email(),
		role: z.string(),
		accountStatus: z.string(),
	}),
	token: z.string(),
});

const currentUserResponseSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	email: z.string().email(),
	role: z.string(),
	accountStatus: z.string(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

// Schemas para erros (usados em testes quando $ref não está disponível)
const validationErrorSchema = z.object({
	error: z.string(),
	message: z.string(),
	details: z.array(z.unknown()).optional(),
	traceId: z.string().optional(),
});

const unauthorizedErrorSchema = z.object({
	error: z.string(),
	message: z.string(),
	traceId: z.string().optional(),
});

const notFoundErrorSchema = z.object({
	error: z.string(),
	message: z.string(),
	traceId: z.string().optional(),
});

const forbiddenErrorSchema = z.object({
	error: z.string(),
	message: z.string(),
	traceId: z.string().optional(),
});

/**
 * Rotas de autenticação
 * POST /auth/register - Registra novo usuário
 * POST /auth/login - Autentica usuário
 * GET /auth/me - Obtém dados do usuário autenticado
 */
export async function authRoutes(
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos, necessário type assertion
	fastify: any,
	options: { container: AppContainer },
) {
	const { container } = options;

	// Permite registrar rotas para documentação Swagger mesmo sem UserRepository
	// O erro será lançado apenas quando tentar executar uma rota sem repositório configurado
	if (!container.userRepository) {
		// Em desenvolvimento, permite registrar rotas apenas para documentação
		// As rotas retornarão erro 500 se tentarem executar sem repositório
		// Em produção, configure um UserRepository real antes de registrar as rotas
	}

	// Verifica se UserRepository está configurado antes de criar use cases
	// Isso permite que as rotas sejam registradas para documentação Swagger
	// mas lança erro se tentar executar sem repositório
	if (!container.userRepository) {
		// Cria handlers que retornam erro se tentarem executar sem repositório
		// Isso permite que o Swagger gere a documentação mesmo sem repositório
		const errorHandler = async () => {
			throw new Error(
				'UserRepository não está configurado. Configure via container.setUserRepository()',
			);
		};

		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		(fastify as any).post(
			'/auth/register',
			{
				schema: {
					description: 'Registra um novo usuário na aplicação',
					tags: ['auth'],
					body: createRequestSchema({ body: registerRequestSchema }).body,
					response: {
						201: createResponseSchema(
							registerResponseSchema,
							'Usuário registrado com sucesso',
							{
								user: {
									id: '123e4567-e89b-12d3-a456-426614174000',
									name: 'João Silva',
									email: 'joao.silva@example.com',
									role: 'ROLE_CUSTOMER',
									accountStatus: 'ACTIVE',
									createdAt: '2024-01-01T00:00:00.000Z',
									updatedAt: '2024-01-01T00:00:00.000Z',
								},
								token:
									'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6ImpvYW8uc2lsdmFAZXhhbXBsZS5jb20iLCJyb2xlIjoiUk9MRV9VU0VSIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE3MDQwNzA4MDB9.example',
							},
						),
						400: createResponseSchema(
							validationErrorSchema,
							'Erro de validação ou email duplicado',
							{
								error: 'ValidationError',
								message: 'Erro de validação nos dados fornecidos',
								details: [
									{
										path: ['email'],
										message: 'Email já está em uso',
									},
								],
								traceId: '123e4567-e89b-12d3-a456-426614174000',
							},
						),
					},
				},
			},
			errorHandler,
		);

		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		(fastify as any).post(
			'/auth/login',
			{
				schema: {
					description: 'Autentica um usuário e retorna token JWT',
					tags: ['auth'],
					body: createRequestSchema({ body: loginRequestSchema }).body,
					response: {
						200: createResponseSchema(
							loginResponseSchema,
							'Login realizado com sucesso',
							{
								user: {
									id: '123e4567-e89b-12d3-a456-426614174000',
									name: 'João Silva',
									email: 'joao.silva@example.com',
									role: 'ROLE_CUSTOMER',
									accountStatus: 'ACTIVE',
								},
								token:
									'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6ImpvYW8uc2lsdmFAZXhhbXBsZS5jb20iLCJyb2xlIjoiUk9MRV9VU0VSIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE3MDQwNzA4MDB9.example',
							},
						),
						400: createResponseSchema(
							validationErrorSchema,
							'Erro de validação',
							{
								error: 'ValidationError',
								message: 'Erro de validação nos dados fornecidos',
								details: [
									{
										path: ['email'],
										message: 'Email inválido',
									},
								],
								traceId: '123e4567-e89b-12d3-a456-426614174000',
							},
						),
						401: createResponseSchema(
							unauthorizedErrorSchema,
							'Credenciais inválidas',
							{
								error: 'AuthError',
								message: 'Credenciais inválidas',
								traceId: '123e4567-e89b-12d3-a456-426614174000',
							},
						),
					},
				},
			},
			errorHandler,
		);

		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		(fastify as any).get(
			'/auth/me',
			{
				schema: {
					description: 'Obtém dados do usuário autenticado',
					tags: ['auth'],
					security: [{ bearerAuth: [] }],
					response: {
						200: createResponseSchema(
							currentUserResponseSchema,
							'Dados do usuário autenticado',
							{
								id: '123e4567-e89b-12d3-a456-426614174000',
								name: 'João Silva',
								email: 'joao.silva@example.com',
								role: 'ROLE_CUSTOMER',
								accountStatus: 'ACTIVE',
								createdAt: '2024-01-01T00:00:00.000Z',
								updatedAt: '2024-01-01T00:00:00.000Z',
							},
						),
						401: createResponseSchema(
							unauthorizedErrorSchema,
							'Não autenticado',
							{
								error: 'AuthError',
								message: 'Token de autenticação não fornecido',
								traceId: '123e4567-e89b-12d3-a456-426614174000',
							},
						),
						404: createResponseSchema(
							notFoundErrorSchema,
							'Usuário não encontrado',
							{
								error: 'NotFoundError',
								message: 'Usuário não encontrado',
								traceId: '123e4567-e89b-12d3-a456-426614174000',
							},
						),
					},
				},
			},
			errorHandler,
		);

		return;
	}

	const registerUseCase = new RegisterUserUseCase(
		container.userRepository,
		container.passwordHasher,
		container.jwtService,
	);

	const loginUseCase = new LoginUseCase(
		container.userRepository,
		container.passwordHasher,
		container.jwtService,
	);

	const getCurrentUserUseCase = new GetCurrentUserUseCase(
		container.userRepository,
	);

	// POST /auth/register
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).post(
		'/auth/register',
		{
			config: {
				rateLimit: {
					max: 3, // Apenas 3 registros por minuto para prevenir spam
					timeWindow: '1 minute',
				},
			},
			schema: {
				description: 'Registra um novo usuário na aplicação',
				tags: ['auth'],
				body: {
					...(createRequestSchema({ body: registerRequestSchema })
						.body as Record<string, unknown>),
					// Adiciona exemplo para documentação Swagger
					// O Fastify está configurado para ignorar propriedades desconhecidas
					example: {
						name: 'João Silva',
						email: 'joao.silva@example.com',
						password: 'senhaSegura123',
					},
				},
				response: {
					201: createResponseSchema(
						registerResponseSchema,
						'Usuário registrado com sucesso',
						{
							user: {
								id: '123e4567-e89b-12d3-a456-426614174000',
								name: 'João Silva',
								email: 'joao.silva@example.com',
								role: 'ROLE_CUSTOMER',
								accountStatus: 'ACTIVE',
								createdAt: '2024-01-01T00:00:00.000Z',
								updatedAt: '2024-01-01T00:00:00.000Z',
							},
							token:
								'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6ImpvYW8uc2lsdmFAZXhhbXBsZS5jb20iLCJyb2xlIjoiUk9MRV9VU0VSIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE3MDQwNzA4MDB9.example',
						},
					),
					400: createResponseSchema(
						validationErrorSchema,
						'Erro de validação ou email duplicado',
						{
							error: 'ValidationError',
							message: 'Erro de validação nos dados fornecidos',
							details: [
								{
									path: ['email'],
									message: 'Email já está em uso',
								},
							],
							traceId: '123e4567-e89b-12d3-a456-426614174000',
						},
					),
					403: createResponseSchema(
						forbiddenErrorSchema,
						'Sem permissão para cadastrar este tipo de usuário',
						{
							error: 'ForbiddenError',
							message:
								'Apenas Super Admin pode cadastrar Company. Apenas Company pode cadastrar empregados e entregadores.',
							traceId: '123e4567-e89b-12d3-a456-426614174000',
						},
					),
				},
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any, reply: any) => {
			const body = request.body as {
				name: string;
				email: string;
				password: string;
				role?: UserRole;
				accountStatus?: AccountStatus;
			};
			let actor: { id: string; role: UserRole } | undefined;
			const authHeader = request.headers?.authorization;
			if (authHeader && typeof authHeader === 'string') {
				const parts = authHeader.split(' ');
				if (parts.length === 2 && parts[0] === 'Bearer') {
					const validation = container.jwtService.validate(parts[1]);
					if (validation.valid && validation.payload) {
						actor = {
							id: validation.payload.userId,
							role: validation.payload.role as UserRole,
						};
					}
				}
			}
			const role = body.role ?? UserRole.CUSTOMER;
			const result = await registerUseCase.execute({
				name: body.name,
				email: body.email,
				password: body.password,
				role,
				accountStatus: body.accountStatus,
				actor,
			});

			return reply.code(201).send({
				user: {
					...result.user,
					createdAt: result.user.createdAt.toISOString(),
					updatedAt: result.user.updatedAt.toISOString(),
				},
				token: result.token,
			});
		},
	);

	// POST /auth/login
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).post(
		'/auth/login',
		{
			config: {
				rateLimit: {
					max: 5, // Apenas 5 tentativas de login por minuto
					timeWindow: '1 minute',
				},
			},
			schema: {
				description: 'Autentica um usuário e retorna token JWT',
				tags: ['auth'],
				body: {
					...(createRequestSchema({ body: loginRequestSchema }).body as Record<
						string,
						unknown
					>),
					// Adiciona exemplo para documentação Swagger
					// O Fastify está configurado para ignorar propriedades desconhecidas
					example: {
						email: 'joao.silva@example.com',
						password: 'senhaSegura123',
					},
				},
				response: {
					200: createResponseSchema(
						loginResponseSchema,
						'Login realizado com sucesso',
						{
							user: {
								id: '123e4567-e89b-12d3-a456-426614174000',
								name: 'João Silva',
								email: 'joao.silva@example.com',
								role: 'ROLE_CUSTOMER',
								accountStatus: 'ACTIVE',
							},
							token:
								'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6ImpvYW8uc2lsdmFAZXhhbXBsZS5jb20iLCJyb2xlIjoiUk9MRV9VU0VSIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE3MDQwNzA4MDB9.example',
						},
					),
					400: createResponseSchema(
						validationErrorSchema,
						'Erro de validação',
						{
							error: 'ValidationError',
							message: 'Erro de validação nos dados fornecidos',
							details: [
								{
									path: ['email'],
									message: 'Email inválido',
								},
							],
							traceId: '123e4567-e89b-12d3-a456-426614174000',
						},
					),
					401: createResponseSchema(
						unauthorizedErrorSchema,
						'Credenciais inválidas',
						{
							error: 'AuthError',
							message: 'Credenciais inválidas',
							traceId: '123e4567-e89b-12d3-a456-426614174000',
						},
					),
				},
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any) => {
			// Valida o body manualmente para garantir que erros de validação retornem 400
			const validationResult = loginRequestSchema.safeParse(request.body);
			if (!validationResult.success) {
				// Lança ZodError que será capturado pelo error handler e retornará 400
				throw validationResult.error;
			}

			const result = await loginUseCase.execute(validationResult.data);

			return {
				user: result.user,
				token: result.token,
			};
		},
	);

	// GET /auth/me
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).get(
		'/auth/me',
		{
			schema: {
				description: 'Obtém dados do usuário autenticado',
				tags: ['auth'],
				security: [{ bearerAuth: [] }],
				response: {
					200: createResponseSchema(
						currentUserResponseSchema,
						'Dados do usuário autenticado',
						{
							id: '123e4567-e89b-12d3-a456-426614174000',
							name: 'João Silva',
							email: 'joao.silva@example.com',
							role: 'ROLE_CUSTOMER',
							accountStatus: 'ACTIVE',
							createdAt: '2024-01-01T00:00:00.000Z',
							updatedAt: '2024-01-01T00:00:00.000Z',
						},
					),
					401: createResponseSchema(
						unauthorizedErrorSchema,
						'Não autenticado',
						{
							error: 'AuthError',
							message: 'Token de autenticação não fornecido',
							traceId: '123e4567-e89b-12d3-a456-426614174000',
						},
					),
					404: createResponseSchema(
						notFoundErrorSchema,
						'Usuário não encontrado',
						{
							error: 'NotFoundError',
							message: 'Usuário não encontrado',
							traceId: '123e4567-e89b-12d3-a456-426614174000',
						},
					),
				},
			},
			preHandler: async (request: FastifyRequest, _reply: unknown) => {
				await authMiddleware(request, _reply, container.jwtService);
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any) => {
			const user = (request as { user?: { userId: string } }).user;
			if (!user) {
				throw new Error('Usuário não autenticado');
			}

			const result = await getCurrentUserUseCase.execute({
				userId: user.userId,
			});

			return {
				...result,
				createdAt: result.createdAt.toISOString(),
				updatedAt: result.updatedAt.toISOString(),
			};
		},
	);
}
