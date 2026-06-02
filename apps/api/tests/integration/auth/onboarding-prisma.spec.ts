import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	OnboardingStatus,
	OnboardingStep,
	StoreCurrency,
	StoreLanguage,
	StoreSegment,
	StoreStatus,
	StoreTimezone,
} from '../../../src/core/domain';
import {
	PrismaOnboardingRepository,
	PrismaStoreRepository,
	PrismaUserRepository,
	prisma,
} from '../../../src/core/infra/persistence';
import { createTestServer, makeRequest } from '../helpers';

const runPrismaTests =
	process.env.RUN_PRISMA_INTEGRATION_TESTS === 'true' &&
	Boolean(process.env.DATABASE_URL);

const testEmails = [
	'prisma-onboarding-owner@thalya.test',
	'prisma-onboarding-duplicate@thalya.test',
];
const testDocuments = ['22333444000155', '33444555000166'];

describe.skipIf(!runPrismaTests)('Onboarding - Prisma/Postgres', () => {
	let server: FastifyInstance;

	beforeEach(async () => {
		await cleanupPrismaRecords();
		server = await createTestServer(new PrismaUserRepository(prisma), {
			storeRepository: new PrismaStoreRepository(prisma),
			onboardingRepository: new PrismaOnboardingRepository(prisma),
		});
	});

	afterEach(async () => {
		await server.close();
		await cleanupPrismaRecords();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	it('deve persistir o fluxo completo de onboarding no Postgres', async () => {
		const registerResponse = await makeRequest(server, {
			method: 'POST',
			url: '/auth/register',
			body: {
				name: 'Prisma Owner',
				email: testEmails[0],
				password: 'Secure123',
			},
		});
		expect(registerResponse.statusCode).toBe(201);
		const token = (registerResponse.body as { token: string }).token;

		const profileResponse = await makeRequest(server, {
			method: 'POST',
			url: '/onboarding/store-profile',
			headers: { authorization: `Bearer ${token}` },
			body: {
				storeName: 'Store Flow Prisma',
				phone: '(85) 98888-7777',
				document: testDocuments[0],
				segment: StoreSegment.FASHION,
			},
		});
		expect(profileResponse.statusCode).toBe(200);

		const addressResponse = await makeRequest(server, {
			method: 'POST',
			url: '/onboarding/store-address',
			headers: { authorization: `Bearer ${token}` },
			body: {
				zipCode: '60125-000',
				street: 'Av. Santos Dumont',
				number: '1200',
				neighborhood: 'Aldeota',
				city: 'Fortaleza',
				state: 'CE',
			},
		});
		expect(addressResponse.statusCode).toBe(200);

		const preferencesResponse = await makeRequest(server, {
			method: 'POST',
			url: '/onboarding/preferences',
			headers: { authorization: `Bearer ${token}` },
			body: {
				currency: StoreCurrency.BRL,
				language: StoreLanguage.PT_BR,
				timezone: StoreTimezone.AMERICA_FORTALEZA,
				openingTime: '09:00',
				closingTime: '19:00',
			},
		});
		expect(preferencesResponse.statusCode).toBe(200);

		const completeResponse = await makeRequest(server, {
			method: 'POST',
			url: '/onboarding/complete',
			headers: { authorization: `Bearer ${token}` },
		});
		expect(completeResponse.statusCode).toBe(200);
		expect(completeResponse.body).toMatchObject({
			status: OnboardingStatus.COMPLETED,
			nextStep: OnboardingStep.COMPLETED,
			store: {
				status: StoreStatus.ACTIVE,
				preferences: {
					language: StoreLanguage.PT_BR,
				},
			},
		});

		const persistedStore = await prisma.store.findUnique({
			where: { document: testDocuments[0] },
		});
		expect(persistedStore).toMatchObject({
			name: 'Store Flow Prisma',
			status: StoreStatus.ACTIVE,
		});
		expect(persistedStore?.address).toMatchObject({
			city: 'Fortaleza',
			state: 'CE',
		});
	});

	it('deve manter validação de documento duplicado usando Prisma', async () => {
		const firstToken = await registerAndGetToken(testEmails[0]);
		await saveProfile(firstToken, testDocuments[1]);

		const secondToken = await registerAndGetToken(testEmails[1]);
		const duplicateResponse = await saveProfile(secondToken, testDocuments[1]);

		expect(duplicateResponse.statusCode).toBe(400);
		expect(duplicateResponse.body).toMatchObject({
			error: 'DomainError',
			code: 'TM-DOM-400',
		});
	});

	async function registerAndGetToken(email: string) {
		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/register',
			body: {
				name: 'Prisma Owner',
				email,
				password: 'Secure123',
			},
		});

		return (response.body as { token: string }).token;
	}

	async function saveProfile(token: string, document: string) {
		return makeRequest(server, {
			method: 'POST',
			url: '/onboarding/store-profile',
			headers: { authorization: `Bearer ${token}` },
			body: {
				storeName: 'Store Flow Prisma',
				phone: '(85) 98888-7777',
				document,
				segment: StoreSegment.FASHION,
			},
		});
	}
});

async function cleanupPrismaRecords() {
	await prisma.store.deleteMany({
		where: { document: { in: testDocuments } },
	});
	await prisma.user.deleteMany({
		where: { email: { in: testEmails } },
	});
}
