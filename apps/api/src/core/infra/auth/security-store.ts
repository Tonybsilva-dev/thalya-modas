import { createHash } from 'node:crypto';
import type Redis from 'ioredis';
import { SecurityUnavailableError } from './security-unavailable-error';

export interface SecurityStore {
	get(key: string): Promise<string | null>;
	set(key: string, value: string, ttlSeconds: number): Promise<void>;
	delete(key: string): Promise<void>;
	increment(key: string, ttlSeconds: number, blockAt?: number): Promise<number>;
	ttl(key: string): Promise<number>;
	ping(): Promise<unknown>;
}
export const securityKey = (value: string) =>
	createHash('sha256').update(value).digest('hex');
export class MemorySecurityStore implements SecurityStore {
	private values = new Map<string, { value: string; expires: number }>();
	async get(key: string) {
		const row = this.values.get(key);
		if (!row || row.expires <= Date.now()) {
			this.values.delete(key);
			return null;
		}
		return row.value;
	}
	async set(key: string, value: string, ttl: number) {
		this.values.set(key, { value, expires: Date.now() + ttl * 1000 });
	}
	async delete(key: string) {
		this.values.delete(key);
	}
	async increment(key: string, ttl: number, blockAt?: number) {
		const row = this.values.get(key);
		const previous = row && row.expires > Date.now() ? row.value : null;
		const count = Number(previous ?? 0) + 1;
		if (previous && row) {
			row.value = String(count);
			if (count === blockAt) row.expires = Date.now() + ttl * 1000;
		} else await this.set(key, String(count), ttl);
		return count;
	}
	async ttl(key: string) {
		const row = this.values.get(key);
		return row ? Math.max(0, Math.ceil((row.expires - Date.now()) / 1000)) : 0;
	}

	async ping() {
		return 'PONG';
	}
}
export class RedisSecurityStore implements SecurityStore {
	constructor(private readonly redis: Redis) {}
	private async run<T>(operation: Promise<T>): Promise<T> {
		try {
			return await operation;
		} catch {
			throw new SecurityUnavailableError();
		}
	}
	private key(key: string) {
		return `store-flow:security:${key}`;
	}
	get(key: string) {
		return this.run(this.redis.get(this.key(key)));
	}
	async set(key: string, value: string, ttl: number) {
		await this.run(
			this.redis.set(this.key(key), value, 'EX', Math.max(1, ttl)),
		);
	}
	async delete(key: string) {
		await this.run(this.redis.del(this.key(key)));
	}
	async increment(key: string, ttl: number, blockAt?: number) {
		return Number(
			await this.run(
				this.redis.eval(
					"local n = redis.call('INCR', KEYS[1]); if n == 1 or n == tonumber(ARGV[2]) then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return n",
					1,
					this.key(key),
					ttl,
					blockAt ?? 0,
				),
			),
		);
	}
	async ttl(key: string) {
		return Math.max(0, await this.run(this.redis.ttl(this.key(key))));
	}
	ping() {
		return this.run(this.redis.ping());
	}
}
