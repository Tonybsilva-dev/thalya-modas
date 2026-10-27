import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { InMemoryStoreRepository } from '../../../src/core/infra/persistence';
import {
	createActiveTestStore,
	createTestServer,
	makeRequest,
} from '../helpers';

describe('Commercial customers', () => {
	let server: Awaited<ReturnType<typeof createTestServer>>;
	let stores: InMemoryStoreRepository;
	beforeEach(async () => {
		stores = new InMemoryStoreRepository();
		server = await createTestServer(undefined, { storeRepository: stores });
	});
	afterEach(async () => {
		await server.close();
	});
	async function owner() {
		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/register',
			body: {
				name: 'Owner',
				email: `${randomUUID()}@test.local`,
				password: 'Secure123',
			},
		});
		const body = response.body as { token: string; user: { id: string } };
		await createActiveTestStore(stores, body.user.id);
		return { authorization: `Bearer ${body.token}` };
	}
	it('creates a customer without login or email, edits, searches and archives it', async () => {
		const headers = await owner();
		const created = await makeRequest(server, {
			method: 'POST',
			url: '/customers',
			headers,
			body: { name: '  Maria Silva  ', phone: '(85) 99999-0000' },
		});
		expect(created.statusCode).toBe(201);
		expect(created.body).toMatchObject({
			name: 'Maria Silva',
			phone: '85999990000',
			status: 'ACTIVE',
		});
		const id = (created.body as { id: string }).id;
		expect(
			(
				await makeRequest(server, {
					method: 'PATCH',
					url: `/customers/${id}`,
					headers,
					body: { notes: 'Cliente do bairro', status: 'INACTIVE' },
				})
			).statusCode,
		).toBe(200);
		expect(
			(
				await makeRequest(server, {
					method: 'GET',
					url: '/customers?q=maria&status=INACTIVE',
					headers,
				})
			).body,
		).toMatchObject({ total: 1, items: [{ id, notes: 'Cliente do bairro' }] });
	});
	it('isolates customers and duplicate documents per branch', async () => {
		const first = await owner();
		const second = await owner();
		const body = { name: 'Maria Silva', document: '12345678901' };
		const created = await makeRequest(server, {
			method: 'POST',
			url: '/customers',
			headers: first,
			body,
		});
		const id = (created.body as { id: string }).id;
		expect(
			(
				await makeRequest(server, {
					method: 'POST',
					url: '/customers',
					headers: first,
					body,
				})
			).statusCode,
		).toBe(400);
		expect(
			(
				await makeRequest(server, {
					method: 'POST',
					url: '/customers',
					headers: second,
					body,
				})
			).statusCode,
		).toBe(201);
		expect(
			(
				await makeRequest(server, {
					method: 'GET',
					url: `/customers/${id}`,
					headers: second,
				})
			).statusCode,
		).toBe(404);
		expect(
			(
				await makeRequest(server, {
					method: 'PATCH',
					url: `/customers/${id}`,
					headers: second,
					body: { name: 'Intruder' },
				})
			).statusCode,
		).toBe(404);
		expect(
			(
				await makeRequest(server, {
					method: 'GET',
					url: '/customers?perPage=101',
					headers: first,
				})
			).statusCode,
		).toBe(400);
		expect(
			(await makeRequest(server, { method: 'GET', url: '/customers' }))
				.statusCode,
		).toBe(401);
	});
});
