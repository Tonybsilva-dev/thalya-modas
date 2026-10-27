import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';
import { describe, expect, it } from 'vitest';
import { AccessSecurity } from '../../../src/core/infra/auth/access-security';
import {
	RedisSecurityStore,
	securityKey,
} from '../../../src/core/infra/auth/security-store';
import { SecurityUnavailableError } from '../../../src/core/infra/auth/security-unavailable-error';
import { env } from '../../../src/shared/env';

describe.skipIf(process.env.RUN_REDIS_INTEGRATION_TESTS !== 'true')(
	'Shared Redis security',
	() => {
		it('increments atomically, shares revocations across clients and fails closed offline', async () => {
			const redis = new Redis(env.REDIS_URL!, {
				commandTimeout: 2000,
				maxRetriesPerRequest: 0,
				enableOfflineQueue: false,
			});
			redis.on('error', () => {});
			await new Promise<void>((resolve, reject) => {
				redis.once('ready', resolve);
				redis.once('error', reject);
			});
			const store = new RedisSecurityStore(redis);
			const security = new AccessSecurity(store);
			const key = `test:${randomUUID()}`;
			const userId = randomUUID();
			const token = randomUUID();
			try {
				const counts = await Promise.all(
					Array.from({ length: 20 }, () => store.increment(key, 120, 3)),
				);
				expect(new Set(counts).size).toBe(20);
				expect(await store.get(key)).toBe('20');
				const payload = {
					userId,
					email: 'test@example.test',
					role: 'ROLE_ADMIN',
					exp: Math.floor(Date.now() / 1000) + 60,
				} as const;
				await security.assertSession(token, payload);
				await security.revoke(token, payload);
				await expect(
					new AccessSecurity(new RedisSecurityStore(redis)).assertSession(
						token,
						payload,
					),
				).rejects.toThrow('Sessão encerrada');
				await security.revokeAll(userId);
				await expect(
					security.assertSession('another-token', payload),
				).rejects.toThrow('Sessão encerrada');
				const version = await security.sessionVersion(userId);
				await expect(
					security.assertSession('new-token', {
						...payload,
						sessionVersion: version,
					}),
				).resolves.toBeUndefined();
			} finally {
				await Promise.all([
					store.delete(key),
					store.delete(`user:${userId}`),
					store.delete(`session:${securityKey(token)}`),
				]);
				redis.disconnect();
			}
			await expect(store.get(key)).rejects.toBeInstanceOf(
				SecurityUnavailableError,
			);
		});
	},
);
