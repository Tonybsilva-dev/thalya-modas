import fastify from 'fastify';
import { expect, it } from 'vitest';
import { healthcheckRoutes } from '../../../src/app/http/healthcheck/healthcheck.routes';

it('probes dependencies independently, returns 503 on failure and never returns diagnostics', async () => {
	const app = fastify();
	let databaseChecks = 0;
	await app.register(healthcheckRoutes, {
		checks: {
			database: async () => {
				databaseChecks++;
			},
			redis: async () => {
				throw new Error('redis://secret:password@private-host');
			},
			queues: async () => 'worker heartbeat',
		},
	});
	try {
		expect((await app.inject('/health')).statusCode).toBe(200);
		expect(databaseChecks).toBe(0);
		const response = await app.inject('/health/deep');
		expect(response.statusCode).toBe(503);
		expect(response.json()).toMatchObject({
			status: 'error',
			checks: { database: 'ok', redis: 'error', queues: 'ok' },
		});
		expect(response.body).not.toContain('password');
		expect(response.headers['cache-control']).toBe('no-store');
		expect(databaseChecks).toBe(1);
	} finally {
		await app.close();
	}
});
