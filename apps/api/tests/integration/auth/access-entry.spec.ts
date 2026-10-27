import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	AccessSecurity,
	LoginBlockedError,
} from '../../../src/core/infra/auth/access-security';
import { MemorySecurityStore } from '../../../src/core/infra/auth/security-store';
import { createTestServer, makeRequest } from '../helpers';

describe('Access entry security and activation', () => {
	let server: Awaited<ReturnType<typeof createTestServer>>;
	beforeEach(async () => {
		server = await createTestServer();
	});
	afterEach(async () => {
		vi.useRealTimers();
		await server.close();
	});
	const email = 'entry@storeflow.test';
	const password = 'Secure123';
	async function register() {
		const result = await makeRequest(server, {
			method: 'POST',
			url: '/auth/register',
			body: { name: 'Entry Owner', email, password },
		});
		expect(result.statusCode).toBe(201);
		expect(result.headers['set-cookie']).toContain('HttpOnly');
		const session = result.headers['set-cookie'].split(';')[0];
		expect(
			(
				await makeRequest(server, {
					method: 'GET',
					url: '/auth/me',
					headers: { cookie: session },
				})
			).statusCode,
		).toBe(200);
		return (result.body as { token: string }).token;
	}
	const headers = (token: string) => ({ authorization: `Bearer ${token}` });

	it('blocks the third invalid attempt and rejects even valid credentials during cooldown', async () => {
		await register();
		for (let index = 0; index < 3; index++) {
			const result = await makeRequest(server, {
				method: 'POST',
				url: '/auth/login',
				body: { email, password: 'wrong' },
			});
			expect(result.statusCode).toBe(index < 2 ? 401 : 429);
			if (index === 2) {
				expect(result.headers['retry-after']).toBe('120');
				expect(result.body).toMatchObject({
					code: 'SF-AUTH-429',
					details: { retryAfter: 120 },
				});
				expect((result.body as { traceId: string }).traceId).toBe(
					result.headers['x-trace-id'],
				);
			}
		}
		const blocked = await makeRequest(server, {
			method: 'POST',
			url: '/auth/login',
			body: { email, password },
		});
		expect(blocked.statusCode).toBe(429);
	});

	it('starts a full two-minute cooldown at the third failure and releases it afterwards', async () => {
		vi.useFakeTimers();
		const security = new AccessSecurity(new MemorySecurityStore());
		await security.loginFailed(email, 'ip-a');
		vi.advanceTimersByTime(30000);
		await security.loginFailed(email, 'ip-b');
		vi.advanceTimersByTime(30000);
		await expect(
			security.loginFailed(email.toUpperCase(), 'ip-c'),
		).rejects.toBeInstanceOf(LoginBlockedError);
		vi.advanceTimersByTime(119000);
		await expect(
			security.assertLoginAllowed(email, 'ip-d'),
		).rejects.toBeInstanceOf(LoginBlockedError);
		vi.advanceTimersByTime(1001);
		await expect(
			security.assertLoginAllowed(email, 'ip-d'),
		).resolves.toBeUndefined();
	});

	it('logout revokes the bearer token, while another session remains valid', async () => {
		const first = await register();
		const login = await makeRequest(server, {
			method: 'POST',
			url: '/auth/login',
			body: { email, password },
		});
		const second = (login.body as { token: string }).token;
		expect(first).not.toBe(second);
		expect(
			(
				await makeRequest(server, {
					method: 'POST',
					url: '/auth/logout',
					headers: headers(first),
				})
			).statusCode,
		).toBe(200);
		expect(
			(
				await makeRequest(server, {
					method: 'GET',
					url: '/auth/me',
					headers: headers(first),
				})
			).statusCode,
		).toBe(401);
		expect(
			(
				await makeRequest(server, {
					method: 'GET',
					url: '/auth/me',
					headers: headers(second),
				})
			).statusCode,
		).toBe(200);
		expect(
			(
				await makeRequest(server, {
					method: 'POST',
					url: '/auth/logout-all',
					headers: headers(second),
				})
			).statusCode,
		).toBe(200);
		expect(
			(
				await makeRequest(server, {
					method: 'GET',
					url: '/auth/me',
					headers: headers(second),
				})
			).statusCode,
		).toBe(401);
	});

	it('consumes a reset token only once under concurrency and revokes previous sessions', async () => {
		const oldToken = await register();
		const request = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/request',
			body: { email },
		});
		const code = (request.body as { debugCode: string }).debugCode;
		const verify = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/verify-code',
			body: { email, code },
		});
		const resetToken = (verify.body as { resetToken: string }).resetToken;
		const results = await Promise.all(
			[1, 2].map(() =>
				makeRequest(server, {
					method: 'POST',
					url: '/auth/password-recovery/reset',
					body: {
						resetToken,
						password: 'Changed123',
						passwordConfirmation: 'Changed123',
					},
				}),
			),
		);
		expect(results.map((result) => result.statusCode).sort()).toEqual([
			200, 401,
		]);
		expect(
			(
				await makeRequest(server, {
					method: 'GET',
					url: '/auth/me',
					headers: headers(oldToken),
				})
			).statusCode,
		).toBe(401);
		const login = await makeRequest(server, {
			method: 'POST',
			url: '/auth/login',
			body: { email, password: 'Changed123' },
		});
		expect(login.statusCode).toBe(200);
		expect(
			(
				await makeRequest(server, {
					method: 'GET',
					url: '/auth/me',
					headers: headers((login.body as { token: string }).token),
				})
			).statusCode,
		).toBe(200);
	});

	it('resumes onboarding, forbids early activation and gates operations until Starter confirmation', async () => {
		const token = await register();
		const auth = headers(token);
		const call = (
			method: 'GET' | 'POST',
			url: string,
			body?: Record<string, unknown>,
		) => makeRequest(server, { method, url, headers: auth, body });
		expect((await call('GET', '/auth/me')).body).toMatchObject({
			entryDestination: '/onboarding',
		});
		expect(
			(await call('POST', '/onboarding/plan', { plan: 'STARTER' })).statusCode,
		).toBe(400);
		expect(
			(
				await call('POST', '/onboarding/store-profile', {
					storeName: 'Entry Store',
					phone: '85999990000',
					document: '12345678000199',
					segment: 'fashion',
				})
			).statusCode,
		).toBe(200);
		expect((await call('GET', '/auth/me')).body).toMatchObject({
			entryDestination: '/onboarding/address',
		});
		expect(
			(
				await call('POST', '/onboarding/store-address', {
					zipCode: '60000000',
					street: 'Rua A',
					number: '10',
					neighborhood: 'Centro',
					city: 'Fortaleza',
					state: 'CE',
				})
			).statusCode,
		).toBe(200);
		expect(
			(
				await call('POST', '/onboarding/preferences', {
					currency: 'BRL',
					language: 'pt-BR',
					timezone: 'America/Fortaleza',
					openingTime: '08:00',
					closingTime: '18:00',
				})
			).statusCode,
		).toBe(200);
		expect((await call('POST', '/onboarding/complete')).statusCode).toBe(200);
		expect((await call('GET', '/auth/me')).body).toMatchObject({
			entryDestination: '/onboarding/plan',
		});
		expect((await call('GET', '/products')).statusCode).toBe(403);
		expect(
			(await call('POST', '/onboarding/plan', { plan: 'BUSINESS' })).statusCode,
		).toBe(400);
		expect(
			(await call('POST', '/onboarding/plan', { plan: 'STARTER' })).body,
		).toMatchObject({ success: true, destination: '/admin/dashboard' });
		expect(
			(await call('POST', '/onboarding/plan', { plan: 'STARTER' })).statusCode,
		).toBe(200);
		expect((await call('GET', '/products')).statusCode).toBe(200);
		expect((await call('GET', '/auth/me')).body).not.toHaveProperty(
			'entryDestination',
		);
	});
});
