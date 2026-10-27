import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { authSessionCookieName } from '../../../src/app/http/auth-session-cookie';
import {
	OnboardingStatus,
	OnboardingStep,
	StoreCurrency,
	StoreLanguage,
	StoreSegment,
	StoreStatus,
	StoreTimezone,
} from '../../../src/core/domain';
import { createTestServer, makeRequest } from '../helpers';

describe('Onboarding - Integração', () => {
	let server: FastifyInstance;

	beforeEach(async () => {
		server = await createTestServer();
	});

	afterEach(async () => {
		await server.close();
	});

	it('deve criar usuário, iniciar onboarding, salvar perfil da loja e concluir', async () => {
		const registerResponse = await makeRequest(server, {
			method: 'POST',
			url: '/auth/register',
			body: {
				name: 'Ana Ribeiro',
				email: 'ana@storeflow.example',
				password: 'Secure123',
			},
		});

		expect(registerResponse.statusCode).toBe(201);
		expect(registerResponse.body).toMatchObject({
			user: {
				role: 'ROLE_ADMIN',
				accountStatus: 'ACTIVE',
			},
			onboarding: {
				status: OnboardingStatus.PENDING,
				nextStep: OnboardingStep.STORE_PROFILE,
				completedSteps: [],
			},
		});
		const token = (registerResponse.body as { token: string }).token;

		const initialProgress = await makeRequest(server, {
			method: 'GET',
			url: '/onboarding/me',
			headers: { authorization: `Bearer ${token}` },
		});
		expect(initialProgress.statusCode).toBe(200);
		expect(initialProgress.body).toMatchObject({
			status: OnboardingStatus.PENDING,
			nextStep: OnboardingStep.STORE_PROFILE,
			completedSteps: [],
		});

		const storeProfile = await makeRequest(server, {
			method: 'POST',
			url: '/onboarding/store-profile',
			headers: { authorization: `Bearer ${token}` },
			body: {
				storeName: 'Store Flow',
				phone: '(85) 99999-0000',
				document: '12.345.678/0001-99',
				segment: StoreSegment.FASHION,
			},
		});
		expect(storeProfile.statusCode).toBe(200);
		expect(storeProfile.body).toMatchObject({
			status: OnboardingStatus.PENDING,
			nextStep: OnboardingStep.STORE_ADDRESS,
			completedSteps: [OnboardingStep.STORE_PROFILE],
			store: {
				bucketKey: 'stores/store-flow',
				name: 'Store Flow',
				phone: '85999990000',
				document: '12345678000199',
				segment: StoreSegment.FASHION,
				slug: 'store-flow',
				status: StoreStatus.PENDING_ONBOARDING,
			},
		});

		const storeAddress = await saveAddress(token);
		expect(storeAddress.statusCode).toBe(200);
		expect(storeAddress.body).toMatchObject({
			status: OnboardingStatus.PENDING,
			nextStep: OnboardingStep.STORE_PREFERENCES,
			completedSteps: [
				OnboardingStep.STORE_PROFILE,
				OnboardingStep.STORE_ADDRESS,
			],
			store: {
				address: {
					zipCode: '60125000',
					street: 'Av. Santos Dumont',
					number: '1200',
					neighborhood: 'Aldeota',
					city: 'Fortaleza',
					state: 'CE',
					country: 'BR',
				},
			},
		});

		const preferences = await savePreferences(token);
		expect(preferences.statusCode).toBe(200);
		expect(preferences.body).toMatchObject({
			status: OnboardingStatus.PENDING,
			nextStep: OnboardingStep.COMPLETED,
			completedSteps: [
				OnboardingStep.STORE_PROFILE,
				OnboardingStep.STORE_ADDRESS,
				OnboardingStep.STORE_PREFERENCES,
			],
			store: {
				preferences: {
					currency: StoreCurrency.BRL,
					language: StoreLanguage.PT_BR,
					timezone: StoreTimezone.AMERICA_FORTALEZA,
					openingTime: '09:00',
					closingTime: '19:00',
				},
			},
		});

		const complete = await makeRequest(server, {
			method: 'POST',
			url: '/onboarding/complete',
			headers: { authorization: `Bearer ${token}` },
		});
		expect(complete.statusCode).toBe(200);
		expect(complete.body).toMatchObject({
			status: OnboardingStatus.COMPLETED,
			nextStep: OnboardingStep.COMPLETED,
			completedSteps: [
				OnboardingStep.STORE_PROFILE,
				OnboardingStep.STORE_ADDRESS,
				OnboardingStep.STORE_PREFERENCES,
				OnboardingStep.COMPLETED,
			],
			store: {
				status: StoreStatus.ACTIVE,
			},
		});
	});

	it('deve manter slug e bucketKey após renomear a loja', async () => {
		const token = await registerAndGetToken('slug-imutavel@storeflow.example');
		const firstProfile = await saveProfile(
			token,
			'12.345.678/0001-99',
			'Store Flow',
		);
		const firstStore = (
			firstProfile.body as {
				store: { bucketKey: string; slug: string };
			}
		).store;

		const renamedProfile = await saveProfile(
			token,
			'12.345.678/0001-99',
			'Novo Nome Comercial',
		);

		expect(renamedProfile.statusCode).toBe(200);
		expect(renamedProfile.body).toMatchObject({
			store: {
				bucketKey: firstStore.bucketKey,
				name: 'Novo Nome Comercial',
				slug: firstStore.slug,
			},
		});
		expect(firstStore).toMatchObject({
			bucketKey: 'stores/store-flow',
			slug: 'store-flow',
		});
	});

	it('deve gerar slugs únicos para lojas com o mesmo nome', async () => {
		const firstToken = await registerAndGetToken('slug-1@storeflow.example');
		const firstProfile = await saveProfile(firstToken, '12.345.678/0001-99');
		const secondToken = await registerAndGetToken('slug-2@storeflow.example');
		const secondProfile = await saveProfile(secondToken, '98.765.432/0001-11');

		expect(firstProfile.body).toMatchObject({
			store: {
				bucketKey: 'stores/store-flow',
				slug: 'store-flow',
			},
		});
		expect(secondProfile.body).toMatchObject({
			store: {
				bucketKey: 'stores/store-flow-2',
				slug: 'store-flow-2',
			},
		});
	});

	it('deve rejeitar documento duplicado em outra loja', async () => {
		const firstToken = await registerAndGetToken('ana@storeflow.example');
		await saveProfile(firstToken, '12.345.678/0001-99');

		const secondToken = await registerAndGetToken('bia@storeflow.example');
		const response = await saveProfile(secondToken, '12.345.678/0001-99');

		expect(response.statusCode).toBe(400);
		expect((response.body as { error: string }).error).toBe('DomainError');
	});

	it('deve consultar onboarding usando cookie de sessão', async () => {
		await makeRequest(server, {
			method: 'POST',
			url: '/auth/register',
			body: {
				name: 'Ana Ribeiro',
				email: 'ana@storeflow.example',
				password: 'Secure123',
			},
		});

		const loginResponse = await makeRequest(server, {
			method: 'POST',
			url: '/auth/login',
			body: {
				email: 'ana@storeflow.example',
				password: 'Secure123',
			},
		});
		const setCookie = loginResponse.headers['set-cookie'];
		const sessionCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;

		expect(sessionCookie).toContain(`${authSessionCookieName}=`);

		const response = await makeRequest(server, {
			method: 'GET',
			url: '/onboarding/me',
			headers: { cookie: sessionCookie.split(';')[0] },
		});

		expect(response.statusCode).toBe(200);
		expect(response.body).toMatchObject({
			status: OnboardingStatus.PENDING,
			nextStep: OnboardingStep.STORE_PROFILE,
			completedSteps: [],
		});
	});

	it('deve rejeitar telefone inválido', async () => {
		const token = await registerAndGetToken('ana@storeflow.example');

		const response = await makeRequest(server, {
			method: 'POST',
			url: '/onboarding/store-profile',
			headers: { authorization: `Bearer ${token}` },
			body: {
				storeName: 'Store Flow',
				phone: '123',
				document: '12.345.678/0001-99',
				segment: StoreSegment.FASHION,
			},
		});

		expect(response.statusCode).toBe(400);
	});

	it('deve rejeitar conclusão sem perfil, endereço e preferências', async () => {
		const token = await registerAndGetToken('ana@storeflow.example');

		const response = await makeRequest(server, {
			method: 'POST',
			url: '/onboarding/complete',
			headers: { authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(400);
		expect((response.body as { error: string }).error).toBe('DomainError');
	});

	it('deve rejeitar conclusão sem preferências', async () => {
		const token = await registerAndGetToken('ana@storeflow.example');
		await saveProfile(token, '12.345.678/0001-99');
		await saveAddress(token);

		const response = await makeRequest(server, {
			method: 'POST',
			url: '/onboarding/complete',
			headers: { authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(400);
		expect((response.body as { error: string }).error).toBe('DomainError');
	});

	it('deve rejeitar endereço antes do perfil da loja', async () => {
		const token = await registerAndGetToken('ana@storeflow.example');

		const response = await saveAddress(token);

		expect(response.statusCode).toBe(400);
		expect((response.body as { error: string }).error).toBe('DomainError');
	});

	it('deve rejeitar preferências antes do endereço da loja', async () => {
		const token = await registerAndGetToken('ana@storeflow.example');
		await saveProfile(token, '12.345.678/0001-99');

		const response = await savePreferences(token);

		expect(response.statusCode).toBe(400);
		expect((response.body as { error: string }).error).toBe('DomainError');
	});

	it('deve rejeitar preferências com horário de abertura depois do fechamento', async () => {
		const token = await registerAndGetToken('ana@storeflow.example');
		await saveProfile(token, '12.345.678/0001-99');
		await saveAddress(token);

		const response = await savePreferences(token, {
			openingTime: '20:00',
			closingTime: '09:00',
		});

		expect(response.statusCode).toBe(400);
		expect((response.body as { error: string }).error).toBe('DomainError');
	});

	it('deve rejeitar preferências com timezone inválido', async () => {
		const token = await registerAndGetToken('ana@storeflow.example');
		await saveProfile(token, '12.345.678/0001-99');
		await saveAddress(token);

		const response = await makeRequest(server, {
			method: 'POST',
			url: '/onboarding/preferences',
			headers: { authorization: `Bearer ${token}` },
			body: {
				currency: StoreCurrency.BRL,
				language: StoreLanguage.PT_BR,
				timezone: 'UTC',
				openingTime: '09:00',
				closingTime: '19:00',
			},
		});

		expect(response.statusCode).toBe(400);
	});

	it('deve exigir token para consultar onboarding', async () => {
		const response = await makeRequest(server, {
			method: 'GET',
			url: '/onboarding/me',
		});

		expect(response.statusCode).toBe(401);
	});

	it('deve bloquear onboarding pelo kill switch', async () => {
		await server.close();
		server = await createTestServer(undefined, {
			featureFlags: { onboarding: false },
		});
		const registerResponse = await makeRequest(server, {
			method: 'POST',
			url: '/auth/register',
			body: {
				name: 'Ana Ribeiro',
				email: 'ana@storeflow.example',
				password: 'Secure123',
			},
		});
		const token = (registerResponse.body as { token: string }).token;

		const response = await makeRequest(server, {
			method: 'GET',
			url: '/onboarding/me',
			headers: { authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(403);
		expect((response.body as { error: string }).error).toBe(
			'FeatureDisabledError',
		);
	});

	async function registerAndGetToken(email: string) {
		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/register',
			body: {
				name: 'Ana Ribeiro',
				email,
				password: 'Secure123',
			},
		});

		return (response.body as { token: string }).token;
	}

	async function saveProfile(
		token: string,
		document: string,
		storeName = 'Store Flow',
	) {
		return makeRequest(server, {
			method: 'POST',
			url: '/onboarding/store-profile',
			headers: { authorization: `Bearer ${token}` },
			body: {
				storeName,
				phone: '(85) 99999-0000',
				document,
				segment: StoreSegment.FASHION,
			},
		});
	}

	async function saveAddress(token: string) {
		return makeRequest(server, {
			method: 'POST',
			url: '/onboarding/store-address',
			headers: { authorization: `Bearer ${token}` },
			body: {
				zipCode: '60125-000',
				street: 'Av. Santos Dumont',
				number: '1200',
				neighborhood: 'Aldeota',
				city: 'Fortaleza',
				state: 'ce',
			},
		});
	}

	async function savePreferences(
		token: string,
		overrides?: Partial<{
			currency: StoreCurrency;
			language: StoreLanguage;
			timezone: StoreTimezone;
			openingTime: string;
			closingTime: string;
		}>,
	) {
		return makeRequest(server, {
			method: 'POST',
			url: '/onboarding/preferences',
			headers: { authorization: `Bearer ${token}` },
			body: {
				currency: StoreCurrency.BRL,
				language: StoreLanguage.PT_BR,
				timezone: StoreTimezone.AMERICA_FORTALEZA,
				openingTime: '09:00',
				closingTime: '19:00',
				...overrides,
			},
		});
	}
});
