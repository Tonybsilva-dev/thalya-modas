import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { InMemoryStoreRepository } from '../../../src/core/infra/persistence';
import {
	createActiveTestStore,
	createTestServer,
	makeRequest,
} from '../helpers';

describe('Contexto HTTP de loja', () => {
	let server: FastifyInstance;
	let storeRepository: InMemoryStoreRepository;

	beforeEach(async () => {
		storeRepository = new InMemoryStoreRepository();
		server = await createTestServer(undefined, { storeRepository });
	});

	afterEach(async () => {
		await server.close();
	});

	it('usa fallback e informa o contexto quando há uma única loja acessível', async () => {
		const account = await register();
		const store = await createActiveTestStore(
			storeRepository,
			account.userId,
			'Loja única',
		);

		const response = await getOverview(account.token);

		expect(response.statusCode).toBe(200);
		expect(response.headers['x-store-id']).toBe(store.id);
	});

	it('exige uma seleção explícita quando há mais de uma loja acessível', async () => {
		const account = await register();
		await createActiveTestStore(storeRepository, account.userId, 'Loja A');
		await createActiveTestStore(storeRepository, account.userId, 'Loja B');

		const response = await getOverview(account.token);

		expect(response.statusCode).toBe(400);
		expect(response.body).toMatchObject({
			code: 'TM-DOM-400',
			error: 'DomainError',
			message: 'Informe X-Store-Id para selecionar a loja ativa.',
		});
		expect(
			(response.body as { details: { accessibleStores: unknown[] } }).details
				.accessibleStores,
		).toHaveLength(2);
	});

	it('aceita uma loja acessível selecionada explicitamente', async () => {
		const account = await register();
		await createActiveTestStore(storeRepository, account.userId, 'Loja A');
		const selectedStore = await createActiveTestStore(
			storeRepository,
			account.userId,
			'Loja B',
		);

		const response = await getOverview(account.token, selectedStore.id);

		expect(response.statusCode).toBe(200);
		expect(response.headers['x-store-id']).toBe(selectedStore.id);
	});

	it('rejeita loja não acessível sem revelar sua existência', async () => {
		const account = await register();
		await createActiveTestStore(storeRepository, account.userId);
		const otherAccount = await register();
		const otherStore = await createActiveTestStore(
			storeRepository,
			otherAccount.userId,
		);

		const response = await getOverview(account.token, otherStore.id);

		expect(response.statusCode).toBe(403);
		expect(response.body).toMatchObject({
			code: 'TM-AUTHZ-403',
			error: 'ForbiddenError',
			message: 'Você não tem acesso à loja informada.',
		});
	});

	it('rejeita header malformado antes de consultar dados operacionais', async () => {
		const account = await register();
		await createActiveTestStore(storeRepository, account.userId);

		const response = await getOverview(account.token, 'loja-invalida');

		expect(response.statusCode).toBe(400);
		expect(response.body).toMatchObject({
			code: 'TM-VAL-400',
			error: 'ValidationError',
		});
	});

	it('bloqueia uma conta sem loja associada', async () => {
		const account = await register();

		const response = await getOverview(account.token);

		expect(response.statusCode).toBe(403);
		expect(response.body).toMatchObject({
			code: 'TM-AUTHZ-403',
			error: 'ForbiddenError',
			message: 'Nenhuma loja está associada a este usuário.',
		});
	});

	async function register() {
		const response = await makeRequest(server, {
			body: {
				email: `store-context-${randomUUID()}@thalya.test`,
				name: 'Context User',
				password: 'Secure123',
			},
			method: 'POST',
			url: '/auth/register',
		});
		const body = response.body as {
			token: string;
			user: { id: string };
		};

		return { token: body.token, userId: body.user.id };
	}

	function getOverview(token: string, storeId?: string) {
		return makeRequest(server, {
			headers: {
				authorization: `Bearer ${token}`,
				...(storeId ? { 'x-store-id': storeId } : {}),
			},
			method: 'GET',
			url: '/dashboard/overview',
		});
	}
});
