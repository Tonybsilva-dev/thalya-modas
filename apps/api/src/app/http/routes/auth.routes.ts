import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
	GetCurrentUserUseCase,
	LoginUseCase,
	RegisterUserUseCase,
	RequestPasswordRecoveryUseCase,
	ResendPasswordRecoveryCodeUseCase,
	ResetPasswordUseCase,
	VerifyPasswordRecoveryCodeUseCase,
} from '../../../core/application/use-cases/auth';
import {
	AccountStatus,
	OnboardingStatus,
	OnboardingStep,
	UserRole,
} from '../../../core/domain';
import { env } from '../../../shared/env';
import {
	createRequestSchema,
	createResponseSchema,
} from '../../../shared/utils/zod-to-json-schema';
import { createAuthSessionCookie } from '../auth-session-cookie';
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
	email: z.string().trim().email('Email inválido'),
	password: z.string().min(1, 'Senha é obrigatória'),
	rememberMe: z.boolean().optional(),
});

const passwordRecoveryEmailRequestSchema = z.object({
	email: z.string().trim().email('Email inválido'),
});

const passwordRecoveryVerifyCodeRequestSchema = z.object({
	email: z.string().trim().email('Email inválido'),
	code: z.string().regex(/^\d{6}$/, 'Código deve conter 6 dígitos'),
});

const passwordRecoveryResetRequestSchema = z
	.object({
		resetToken: z.string().min(32, 'Token de recuperação inválido'),
		password: z
			.string()
			.min(8, 'Senha deve ter pelo menos 8 caracteres')
			.regex(/[A-Z]/, 'Senha deve conter uma letra maiúscula')
			.regex(/[0-9]/, 'Senha deve conter um número'),
		passwordConfirmation: z
			.string()
			.min(1, 'Confirmação de senha é obrigatória'),
	})
	.refine((data) => data.password === data.passwordConfirmation, {
		message: 'As senhas não conferem',
		path: ['passwordConfirmation'],
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
	onboarding: z
		.object({
			status: z.nativeEnum(OnboardingStatus),
			nextStep: z.nativeEnum(OnboardingStep),
			completedSteps: z.array(z.nativeEnum(OnboardingStep)),
		})
		.optional(),
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
	expiresIn: z.number(),
});

const passwordRecoveryRequestResponseSchema = z.object({
	accepted: z.literal(true),
	expiresIn: z.number(),
	resendAvailableIn: z.number(),
	debugCode: z.string().optional(),
});

const passwordRecoveryVerifyCodeResponseSchema = z.object({
	resetToken: z.string(),
	expiresIn: z.number(),
});

const passwordRecoveryResetResponseSchema = z.object({
	success: z.literal(true),
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

const registerSuccessExample = {
	user: {
		id: '123e4567-e89b-12d3-a456-426614174000',
		name: 'Ana Ribeiro',
		email: 'ana@thalyamodas.com',
		role: 'ROLE_COMPANY',
		accountStatus: 'ACTIVE',
		createdAt: '2026-06-01T00:00:00.000Z',
		updatedAt: '2026-06-01T00:00:00.000Z',
	},
	token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.preview-register-token',
	onboarding: {
		status: 'PENDING',
		nextStep: 'STORE_PROFILE',
		completedSteps: [],
	},
};

const loginSuccessExample = {
	user: {
		id: '123e4567-e89b-12d3-a456-426614174000',
		name: 'Ana Ribeiro',
		email: 'ana@thalyamodas.com',
		role: 'ROLE_COMPANY',
		accountStatus: 'ACTIVE',
	},
	token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.preview-login-token',
	expiresIn: 604800,
};

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
							registerSuccessExample,
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
							loginSuccessExample,
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
					security: [{ bearerAuth: [] }, { sessionCookie: [] }],
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

	if (!container.passwordRecoveryRepository) {
		throw new Error(
			'PasswordRecoveryRepository não está configurado. Configure via container.setPasswordRecoveryRepository()',
		);
	}

	const requestPasswordRecoveryUseCase = new RequestPasswordRecoveryUseCase(
		container.userRepository,
		container.passwordRecoveryRepository,
	);

	const verifyPasswordRecoveryCodeUseCase =
		new VerifyPasswordRecoveryCodeUseCase(container.passwordRecoveryRepository);

	const resendPasswordRecoveryCodeUseCase =
		new ResendPasswordRecoveryCodeUseCase(
			container.userRepository,
			container.passwordRecoveryRepository,
		);

	const resetPasswordUseCase = new ResetPasswordUseCase(
		container.userRepository,
		container.passwordRecoveryRepository,
		container.passwordHasher,
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
						name: 'Ana Ribeiro',
						email: 'ana@thalyamodas.com',
						password: 'SenhaSegura123',
					},
				},
				response: {
					201: createResponseSchema(
						registerResponseSchema,
						'Usuário registrado com sucesso',
						registerSuccessExample,
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
						'Sem permissão ou funcionalidade desabilitada',
						{
							error: 'FeatureDisabledError',
							message: 'Funcionalidade temporariamente indisponível.',
							details: { feature: 'auth.register' },
							traceId: '123e4567-e89b-12d3-a456-426614174000',
						},
					),
				},
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any, reply: any) => {
			container.featureFlags.assertEnabled('auth.register');

			const validationResult = registerRequestSchema.safeParse(request.body);
			if (!validationResult.success) {
				throw validationResult.error;
			}

			const body = validationResult.data;
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
			const result = await registerUseCase.execute({
				name: body.name,
				email: body.email,
				password: body.password,
				role: body.role,
				accountStatus: body.accountStatus,
				actor,
			});
			const onboarding =
				!actor && container.onboardingRepository
					? await container.onboardingRepository.create({
							userId: result.user.id,
							status: OnboardingStatus.PENDING,
							nextStep: OnboardingStep.STORE_PROFILE,
							completedSteps: [],
						})
					: undefined;

			return reply.code(201).send({
				user: {
					...result.user,
					createdAt: result.user.createdAt.toISOString(),
					updatedAt: result.user.updatedAt.toISOString(),
				},
				token: result.token,
				onboarding: onboarding
					? {
							status: onboarding.status,
							nextStep: onboarding.nextStep,
							completedSteps: onboarding.completedSteps,
						}
					: undefined,
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
						email: 'ana@thalyamodas.com',
						password: 'SenhaSegura123',
						rememberMe: false,
					},
				},
				response: {
					200: createResponseSchema(
						loginResponseSchema,
						'Login realizado com sucesso',
						loginSuccessExample,
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
					403: createResponseSchema(
						forbiddenErrorSchema,
						'Funcionalidade desabilitada',
						{
							error: 'FeatureDisabledError',
							message: 'Funcionalidade temporariamente indisponível.',
							details: { feature: 'auth.login' },
							traceId: '123e4567-e89b-12d3-a456-426614174000',
						},
					),
				},
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any, reply: any) => {
			container.featureFlags.assertEnabled('auth.login');

			// Valida o body manualmente para garantir que erros de validação retornem 400
			const validationResult = loginRequestSchema.safeParse(request.body);
			if (!validationResult.success) {
				// Lança ZodError que será capturado pelo error handler e retornará 400
				throw validationResult.error;
			}

			const result = await loginUseCase.execute(validationResult.data);

			return reply
				.header(
					'Set-Cookie',
					createAuthSessionCookie(result.token, result.expiresIn),
				)
				.send({
					user: result.user,
					token: result.token,
					expiresIn: result.expiresIn,
				});
		},
	);

	// POST /auth/password-recovery/request
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).post(
		'/auth/password-recovery/request',
		{
			config: {
				rateLimit: {
					max: 5,
					timeWindow: '1 minute',
				},
			},
			schema: {
				description: 'Solicita código temporário para recuperação de senha',
				tags: ['auth'],
				body: {
					...(createRequestSchema({
						body: passwordRecoveryEmailRequestSchema,
					}).body as Record<string, unknown>),
					example: {
						email: 'ana@thalyamodas.com',
					},
				},
				response: {
					202: createResponseSchema(
						passwordRecoveryRequestResponseSchema,
						'Solicitação aceita',
						{
							accepted: true,
							expiresIn: 600,
							resendAvailableIn: 30,
							debugCode: '123456',
						},
					),
					400: createResponseSchema(validationErrorSchema, 'Erro de validação'),
					403: createResponseSchema(
						forbiddenErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any, reply: any) => {
			container.featureFlags.assertEnabled('passwordRecovery');
			container.featureFlags.assertEnabled('passwordRecovery.request');

			const validationResult = passwordRecoveryEmailRequestSchema.safeParse(
				request.body,
			);
			if (!validationResult.success) {
				throw validationResult.error;
			}

			const result = await requestPasswordRecoveryUseCase.execute({
				email: validationResult.data.email,
				includeDebugCode: env.NODE_ENV !== 'production',
			});

			return reply.code(202).send(result);
		},
	);

	// POST /auth/password-recovery/verify-code
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).post(
		'/auth/password-recovery/verify-code',
		{
			config: {
				rateLimit: {
					max: 10,
					timeWindow: '1 minute',
				},
			},
			schema: {
				description: 'Valida código temporário e emite token de redefinição',
				tags: ['auth'],
				body: {
					...(createRequestSchema({
						body: passwordRecoveryVerifyCodeRequestSchema,
					}).body as Record<string, unknown>),
					example: {
						email: 'ana@thalyamodas.com',
						code: '123456',
					},
				},
				response: {
					200: createResponseSchema(
						passwordRecoveryVerifyCodeResponseSchema,
						'Código validado',
						{
							resetToken:
								'7e3ac5b1d7a8db8a6b18d70a813f928c5e6ed9d31f5e96d0a765c6f9078b77a1',
							expiresIn: 600,
						},
					),
					400: createResponseSchema(validationErrorSchema, 'Erro de validação'),
					401: createResponseSchema(unauthorizedErrorSchema, 'Código inválido'),
					403: createResponseSchema(
						forbiddenErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any) => {
			container.featureFlags.assertEnabled('passwordRecovery');
			container.featureFlags.assertEnabled('passwordRecovery.verifyCode');

			const validationResult =
				passwordRecoveryVerifyCodeRequestSchema.safeParse(request.body);
			if (!validationResult.success) {
				throw validationResult.error;
			}

			return verifyPasswordRecoveryCodeUseCase.execute(validationResult.data);
		},
	);

	// POST /auth/password-recovery/resend-code
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).post(
		'/auth/password-recovery/resend-code',
		{
			config: {
				rateLimit: {
					max: 5,
					timeWindow: '1 minute',
				},
			},
			schema: {
				description: 'Reenvia código temporário de recuperação de senha',
				tags: ['auth'],
				body: {
					...(createRequestSchema({
						body: passwordRecoveryEmailRequestSchema,
					}).body as Record<string, unknown>),
					example: {
						email: 'ana@thalyamodas.com',
					},
				},
				response: {
					202: createResponseSchema(
						passwordRecoveryRequestResponseSchema,
						'Reenvio aceito',
						{
							accepted: true,
							expiresIn: 600,
							resendAvailableIn: 30,
							debugCode: '654321',
						},
					),
					400: createResponseSchema(validationErrorSchema, 'Erro de validação'),
					403: createResponseSchema(
						forbiddenErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any, reply: any) => {
			container.featureFlags.assertEnabled('passwordRecovery');
			container.featureFlags.assertEnabled('passwordRecovery.resendCode');

			const validationResult = passwordRecoveryEmailRequestSchema.safeParse(
				request.body,
			);
			if (!validationResult.success) {
				throw validationResult.error;
			}

			const result = await resendPasswordRecoveryCodeUseCase.execute({
				email: validationResult.data.email,
				includeDebugCode: env.NODE_ENV !== 'production',
			});

			return reply.code(202).send(result);
		},
	);

	// POST /auth/password-recovery/reset
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).post(
		'/auth/password-recovery/reset',
		{
			config: {
				rateLimit: {
					max: 5,
					timeWindow: '1 minute',
				},
			},
			schema: {
				description: 'Redefine a senha usando token temporário',
				tags: ['auth'],
				body: {
					...(createRequestSchema({
						body: passwordRecoveryResetRequestSchema,
					}).body as Record<string, unknown>),
					example: {
						resetToken:
							'7e3ac5b1d7a8db8a6b18d70a813f928c5e6ed9d31f5e96d0a765c6f9078b77a1',
						password: 'NovaSenha123',
						passwordConfirmation: 'NovaSenha123',
					},
				},
				response: {
					200: createResponseSchema(
						passwordRecoveryResetResponseSchema,
						'Senha redefinida',
						{ success: true },
					),
					400: createResponseSchema(validationErrorSchema, 'Erro de validação'),
					401: createResponseSchema(unauthorizedErrorSchema, 'Token inválido'),
					403: createResponseSchema(
						forbiddenErrorSchema,
						'Funcionalidade desabilitada',
					),
				},
			},
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any) => {
			container.featureFlags.assertEnabled('passwordRecovery');
			container.featureFlags.assertEnabled('passwordRecovery.reset');

			const validationResult = passwordRecoveryResetRequestSchema.safeParse(
				request.body,
			);
			if (!validationResult.success) {
				throw validationResult.error;
			}

			return resetPasswordUseCase.execute(validationResult.data);
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
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
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
