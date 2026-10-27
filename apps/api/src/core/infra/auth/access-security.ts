import { randomUUID } from 'node:crypto';
import { AppError } from '../../../app/http/errors/app-error';
import { AuthError } from '../../../app/http/errors/auth-error';
import type { JWTPayload } from './jwt-service';
import { type SecurityStore, securityKey } from './security-store';

export class LoginBlockedError extends AppError {
	constructor(public readonly retryAfter: number) {
		super(
			`Muitas tentativas. Tente novamente em ${retryAfter} segundos.`,
			429,
			'LoginBlockedError',
			{ details: { retryAfter } },
		);
	}
}
export class AccessSecurity {
	constructor(public readonly store: SecurityStore) {}
	private account(email: string) {
		return `login:account:${securityKey(email.trim().toLowerCase())}`;
	}
	private ip(ip: string) {
		return `login:ip:${securityKey(ip)}`;
	}
	async assertLoginAllowed(email: string, ip: string) {
		for (const [key, limit] of [
			[this.account(email), 3],
			[this.ip(ip), 30],
		] as const) {
			if (Number(await this.store.get(key)) >= limit)
				throw new LoginBlockedError((await this.store.ttl(key)) || 1);
		}
	}
	async loginFailed(email: string, ip: string) {
		const count = await this.store.increment(this.account(email), 120, 3);
		const ipCount = await this.store.increment(this.ip(ip), 120, 30);
		if (count >= 3 || ipCount >= 30)
			throw new LoginBlockedError(
				(await this.store.ttl(
					count >= 3 ? this.account(email) : this.ip(ip),
				)) || 1,
			);
	}
	async loginSucceeded(email: string) {
		await this.store.delete(this.account(email));
	}
	async assertSession(token: string, payload: JWTPayload) {
		const [revoked, version] = await Promise.all([
			this.store.get(`session:${securityKey(token)}`),
			this.store.get(`user:${payload.userId}`),
		]);
		if (revoked || (version ?? '0') !== (payload.sessionVersion ?? '0'))
			throw new AuthError('Sessão encerrada. Entre novamente.');
	}
	async revoke(token: string, payload: JWTPayload) {
		await this.store.set(
			`session:${securityKey(token)}`,
			'revoked',
			Math.max(1, (payload.exp ?? 0) - Math.floor(Date.now() / 1000)),
		);
	}
	async sessionVersion(userId: string) {
		return (await this.store.get(`user:${userId}`)) ?? '0';
	}
	async revokeAll(userId: string) {
		await this.store.set(`user:${userId}`, randomUUID(), 31 * 24 * 3600);
	}
}
