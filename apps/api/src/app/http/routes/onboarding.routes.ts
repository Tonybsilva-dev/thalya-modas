import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
	CompleteOnboardingUseCase,
	GetOnboardingUseCase,
	SaveStoreAddressUseCase,
	SaveStorePreferencesUseCase,
	SaveStoreProfileUseCase,
} from '../../../core/application/use-cases/onboarding';
import {
	OnboardingStatus,
	OnboardingStep,
	StoreCurrency,
	StoreLanguage,
	StoreSegment,
	StoreTimezone,
} from '../../../core/domain';
import {
	createRequestSchema,
	createResponseSchema,
} from '../../../shared/utils/zod-to-json-schema';
import type { AppContainer } from '../container';
import { authMiddleware } from '../middlewares/auth';

const storeProfileRequestSchema = z.object({
	storeName: z
		.string()
		.trim()
		.min(2, 'Nome da loja deve ter pelo menos 2 caracteres'),
	phone: z.string().min(10, 'Telefone inválido'),
	document: z.string().min(11, 'Documento inválido'),
	segment: z.nativeEnum(StoreSegment),
});

const storeAddressRequestSchema = z.object({
	zipCode: z.string().min(8, 'CEP inválido'),
	street: z.string().trim().min(1, 'Rua é obrigatória'),
	number: z.string().trim().min(1, 'Número é obrigatório'),
	complement: z.string().trim().optional(),
	neighborhood: z.string().trim().min(1, 'Bairro é obrigatório'),
	city: z.string().trim().min(1, 'Cidade é obrigatória'),
	state: z.string().trim().min(2, 'Estado é obrigatório'),
	country: z.string().trim().optional(),
});

const storePreferencesRequestSchema = z.object({
	currency: z.nativeEnum(StoreCurrency).default(StoreCurrency.BRL),
	language: z.nativeEnum(StoreLanguage).default(StoreLanguage.PT_BR),
	timezone: z
		.nativeEnum(StoreTimezone)
		.default(StoreTimezone.AMERICA_FORTALEZA),
	openingTime: z
		.string()
		.regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário de abertura inválido'),
	closingTime: z
		.string()
		.regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário de fechamento inválido'),
});

const onboardingResponseSchema = z.object({
	status: z.nativeEnum(OnboardingStatus),
	nextStep: z.nativeEnum(OnboardingStep),
	completedSteps: z.array(z.nativeEnum(OnboardingStep)),
	store: z
		.object({
			id: z.string().uuid(),
			ownerId: z.string().uuid(),
			name: z.string(),
			slug: z.string(),
			bucketKey: z.string(),
			phone: z.string(),
			document: z.string(),
			segment: z.nativeEnum(StoreSegment),
			address: z
				.object({
					zipCode: z.string(),
					street: z.string(),
					number: z.string(),
					complement: z.string().optional(),
					neighborhood: z.string(),
					city: z.string(),
					state: z.string(),
					country: z.string(),
				})
				.optional(),
			preferences: z
				.object({
					currency: z.nativeEnum(StoreCurrency),
					language: z.nativeEnum(StoreLanguage),
					timezone: z.nativeEnum(StoreTimezone),
					openingTime: z.string(),
					closingTime: z.string(),
				})
				.optional(),
			status: z.string(),
			createdAt: z.string().datetime(),
			updatedAt: z.string().datetime(),
		})
		.optional(),
});

const validationErrorSchema = z.object({
	error: z.string(),
	message: z.string(),
	details: z.array(z.unknown()).optional(),
	traceId: z.string().optional(),
});

const authErrorSchema = z.object({
	error: z.string(),
	message: z.string(),
	traceId: z.string().optional(),
});

const onboardingResponseExample = {
	status: 'PENDING',
	nextStep: 'STORE_ADDRESS',
	completedSteps: ['STORE_PROFILE'],
	store: {
		id: '123e4567-e89b-12d3-a456-426614174000',
		ownerId: '123e4567-e89b-12d3-a456-426614174001',
		name: 'Thalya Modas',
		slug: 'thalya-modas',
		bucketKey: 'stores/thalya-modas',
		phone: '85999998888',
		document: '12345678000199',
		segment: 'fashion',
		status: 'PENDING_ONBOARDING',
		createdAt: '2026-06-01T00:00:00.000Z',
		updatedAt: '2026-06-01T00:00:00.000Z',
	},
};

export async function onboardingRoutes(
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos, necessário type assertion
	fastify: any,
	options: { container: AppContainer },
) {
	const { container } = options;

	if (!container.onboardingRepository || !container.storeRepository) {
		throw new Error(
			'OnboardingRepository e StoreRepository precisam estar configurados.',
		);
	}

	const getOnboardingUseCase = new GetOnboardingUseCase(
		container.onboardingRepository,
		container.storeRepository,
	);
	const saveStoreProfileUseCase = new SaveStoreProfileUseCase(
		container.onboardingRepository,
		container.storeRepository,
	);
	const saveStoreAddressUseCase = new SaveStoreAddressUseCase(
		container.onboardingRepository,
		container.storeRepository,
	);
	const saveStorePreferencesUseCase = new SaveStorePreferencesUseCase(
		container.onboardingRepository,
		container.storeRepository,
	);
	const completeOnboardingUseCase = new CompleteOnboardingUseCase(
		container.onboardingRepository,
		container.storeRepository,
	);

	const preHandler = async (request: FastifyRequest, reply: unknown) => {
		container.featureFlags.assertEnabled('onboarding');
		await authMiddleware(request, reply, container.jwtService);
	};

	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).get(
		'/onboarding/me',
		{
			schema: {
				description: 'Obtém progresso do onboarding do usuário autenticado',
				tags: ['onboarding'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					200: createResponseSchema(
						onboardingResponseSchema,
						'Progresso do onboarding',
						onboardingResponseExample,
					),
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
			return serializeOnboarding(
				await getOnboardingUseCase.execute({ userId: user.userId }),
			);
		},
	);

	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).post(
		'/onboarding/preferences',
		{
			schema: {
				description: 'Salva as preferências operacionais iniciais da loja',
				tags: ['onboarding'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				body: {
					...(createRequestSchema({
						body: storePreferencesRequestSchema,
					}).body as Record<string, unknown>),
					example: {
						currency: 'BRL',
						language: 'pt-BR',
						timezone: 'America/Fortaleza',
						openingTime: '09:00',
						closingTime: '19:00',
					},
				},
				response: {
					200: createResponseSchema(
						onboardingResponseSchema,
						'Preferências da loja salvas',
						{
							...onboardingResponseExample,
							nextStep: 'COMPLETED',
							completedSteps: [
								'STORE_PROFILE',
								'STORE_ADDRESS',
								'STORE_PREFERENCES',
							],
						},
					),
					400: createResponseSchema(
						validationErrorSchema,
						'Erro de validação',
						{
							error: 'ValidationError',
							message: 'Erro de validação nos dados fornecidos',
						},
					),
				},
			},
			preHandler,
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any) => {
			const user = getAuthenticatedUser(request);
			const validationResult = storePreferencesRequestSchema.safeParse(
				request.body,
			);
			if (!validationResult.success) {
				throw validationResult.error;
			}

			return serializeOnboarding(
				await saveStorePreferencesUseCase.execute({
					userId: user.userId,
					...validationResult.data,
				}),
			);
		},
	);

	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).post(
		'/onboarding/store-address',
		{
			schema: {
				description: 'Salva o endereço inicial da loja',
				tags: ['onboarding'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				body: {
					...(createRequestSchema({
						body: storeAddressRequestSchema,
					}).body as Record<string, unknown>),
					example: {
						zipCode: '60160150',
						street: 'Rua das Flores',
						number: '120',
						complement: 'Loja 02',
						neighborhood: 'Aldeota',
						city: 'Fortaleza',
						state: 'CE',
						country: 'BR',
					},
				},
				response: {
					200: createResponseSchema(
						onboardingResponseSchema,
						'Endereço da loja salvo',
						{
							...onboardingResponseExample,
							nextStep: 'STORE_PREFERENCES',
							completedSteps: ['STORE_PROFILE', 'STORE_ADDRESS'],
						},
					),
					400: createResponseSchema(
						validationErrorSchema,
						'Erro de validação',
						{
							error: 'ValidationError',
							message: 'Erro de validação nos dados fornecidos',
						},
					),
				},
			},
			preHandler,
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any) => {
			const user = getAuthenticatedUser(request);
			const validationResult = storeAddressRequestSchema.safeParse(
				request.body,
			);
			if (!validationResult.success) {
				throw validationResult.error;
			}

			return serializeOnboarding(
				await saveStoreAddressUseCase.execute({
					userId: user.userId,
					...validationResult.data,
				}),
			);
		},
	);

	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).post(
		'/onboarding/store-profile',
		{
			schema: {
				description: 'Salva o perfil inicial da loja',
				tags: ['onboarding'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				body: {
					...(createRequestSchema({
						body: storeProfileRequestSchema,
					}).body as Record<string, unknown>),
					example: {
						storeName: 'Thalya Modas',
						phone: '(85) 99999-8888',
						document: '12.345.678/0001-99',
						segment: 'fashion',
					},
				},
				response: {
					200: createResponseSchema(
						onboardingResponseSchema,
						'Perfil da loja salvo',
						onboardingResponseExample,
					),
					400: createResponseSchema(
						validationErrorSchema,
						'Erro de validação',
						{
							error: 'ValidationError',
							message: 'Erro de validação nos dados fornecidos',
						},
					),
				},
			},
			preHandler,
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any) => {
			const user = getAuthenticatedUser(request);
			const validationResult = storeProfileRequestSchema.safeParse(
				request.body,
			);
			if (!validationResult.success) {
				throw validationResult.error;
			}

			return serializeOnboarding(
				await saveStoreProfileUseCase.execute({
					userId: user.userId,
					...validationResult.data,
				}),
			);
		},
	);

	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	(fastify as any).post(
		'/onboarding/complete',
		{
			schema: {
				description: 'Finaliza onboarding e ativa a loja',
				tags: ['onboarding'],
				security: [{ bearerAuth: [] }, { sessionCookie: [] }],
				response: {
					200: createResponseSchema(
						onboardingResponseSchema,
						'Onboarding concluído',
						{
							...onboardingResponseExample,
							status: 'COMPLETED',
							nextStep: 'COMPLETED',
							completedSteps: [
								'STORE_PROFILE',
								'STORE_ADDRESS',
								'STORE_PREFERENCES',
								'COMPLETED',
							],
							store: {
								...onboardingResponseExample.store,
								status: 'ACTIVE',
							},
						},
					),
				},
			},
			preHandler,
		},
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		async (request: any) => {
			const user = getAuthenticatedUser(request);
			return serializeOnboarding(
				await completeOnboardingUseCase.execute({ userId: user.userId }),
			);
		},
	);
}

function getAuthenticatedUser(request: { user?: { userId: string } }) {
	if (!request.user) {
		throw new Error('Usuário não autenticado');
	}

	return request.user;
}

function serializeOnboarding(output: {
	status: OnboardingStatus;
	nextStep: OnboardingStep;
	completedSteps: OnboardingStep[];
	store?: {
		id: string;
		ownerId: string;
		name: string;
		slug: string;
		bucketKey: string;
		phone: string;
		document: string;
		segment: StoreSegment;
		address?: {
			zipCode: string;
			street: string;
			number: string;
			complement?: string;
			neighborhood: string;
			city: string;
			state: string;
			country: string;
		};
		preferences?: {
			currency: StoreCurrency;
			language: StoreLanguage;
			timezone: StoreTimezone;
			openingTime: string;
			closingTime: string;
		};
		status: string;
		createdAt: Date;
		updatedAt: Date;
	};
}) {
	return {
		...output,
		store: output.store
			? {
					...output.store,
					createdAt: output.store.createdAt.toISOString(),
					updatedAt: output.store.updatedAt.toISOString(),
				}
			: undefined,
	};
}
