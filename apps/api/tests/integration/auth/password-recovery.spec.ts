import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AccountStatus } from '../../../src/core/domain';
import { Argon2PasswordHasher } from '../../../src/core/infra/auth/password-hasher';
import { InMemoryPasswordRecoveryRepository } from '../../../src/core/infra/persistence';
import { UserFactory } from '../../factories';
import { MockUserRepository } from '../../unit/core/domain/repositories/mock-user-repository';
import { createTestServer, makeRequest } from '../helpers';

describe('Password recovery - Integração', () => {
	let server: FastifyInstance;
	let userRepository: MockUserRepository;
	let passwordRecoveryRepository: InMemoryPasswordRecoveryRepository;
	let passwordHasher: Argon2PasswordHasher;

	beforeEach(async () => {
		userRepository = new MockUserRepository();
		passwordRecoveryRepository = new InMemoryPasswordRecoveryRepository();
		passwordHasher = new Argon2PasswordHasher();
		server = await createTestServer(userRepository, {
			passwordRecoveryRepository,
		});
	});

	afterEach(async () => {
		await server.close();
		userRepository.clear();
	});

	it('deve solicitar código para e-mail existente sem expor existência da conta', async () => {
		await createUser('ana@thalyamodas.com', 'OldPassword1');

		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/request',
			body: { email: 'ANA@THALYAMODAS.COM ' },
		});

		expect(response.statusCode).toBe(202);
		expect(response.body).toMatchObject({
			accepted: true,
			expiresIn: 600,
			resendAvailableIn: 30,
		});
		expect((response.body as { debugCode?: string }).debugCode).toMatch(
			/^\d{6}$/,
		);
	});

	it('deve responder de forma neutra para e-mail inexistente', async () => {
		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/request',
			body: { email: 'missing@thalyamodas.com' },
		});

		expect(response.statusCode).toBe(202);
		expect(response.body).toMatchObject({
			accepted: true,
			expiresIn: 600,
			resendAvailableIn: 30,
		});
		expect((response.body as { debugCode?: string }).debugCode).toBeUndefined();
	});

	it('deve retornar 400 para e-mail inválido na solicitação', async () => {
		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/request',
			body: { email: 'email-invalido' },
		});

		expect(response.statusCode).toBe(400);
		expect((response.body as { error: string }).error).toBe('ValidationError');
	});

	it('deve invalidar código anterior em nova solicitação', async () => {
		await createUser('ana@thalyamodas.com', 'OldPassword1');
		const firstRequest = await requestRecoveryCode('ana@thalyamodas.com');
		const firstCode = (firstRequest.body as { debugCode: string }).debugCode;

		const secondRequest = await requestRecoveryCode('ana@thalyamodas.com');
		const secondCode = (secondRequest.body as { debugCode: string }).debugCode;

		expect(secondCode).toMatch(/^\d{6}$/);

		const oldCodeResponse = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/verify-code',
			body: { email: 'ana@thalyamodas.com', code: firstCode },
		});
		expect(oldCodeResponse.statusCode).toBe(401);

		const newCodeResponse = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/verify-code',
			body: { email: 'ana@thalyamodas.com', code: secondCode },
		});
		expect(newCodeResponse.statusCode).toBe(200);
	});

	it('deve gerar código com expiração de 10 minutos', async () => {
		await createUser('ana@thalyamodas.com', 'OldPassword1');
		const response = await requestRecoveryCode('ana@thalyamodas.com');
		const request = await passwordRecoveryRepository.findActiveByEmail(
			'ana@thalyamodas.com',
		);

		expect(response.statusCode).toBe(202);
		expect(response.body).toMatchObject({
			expiresIn: 600,
			resendAvailableIn: 30,
		});
		expect(request).not.toBeNull();
		expect(request?.codeExpiresAt.getTime()).toBeGreaterThan(Date.now());
	});

	it('deve validar código e redefinir senha', async () => {
		await createUser('ana@thalyamodas.com', 'OldPassword1');
		const requestResponse = await requestRecoveryCode('ana@thalyamodas.com');
		const code = (requestResponse.body as { debugCode: string }).debugCode;

		const verifyResponse = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/verify-code',
			body: { email: 'ana@thalyamodas.com', code },
		});

		expect(verifyResponse.statusCode).toBe(200);
		const resetToken = (verifyResponse.body as { resetToken: string })
			.resetToken;
		expect(resetToken).toHaveLength(64);

		const resetResponse = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/reset',
			body: {
				resetToken,
				password: 'NewPassword1',
				passwordConfirmation: 'NewPassword1',
			},
		});

		expect(resetResponse.statusCode).toBe(200);
		expect(resetResponse.body).toEqual({ success: true });

		const oldLogin = await makeRequest(server, {
			method: 'POST',
			url: '/auth/login',
			body: {
				email: 'ana@thalyamodas.com',
				password: 'OldPassword1',
			},
		});
		expect(oldLogin.statusCode).toBe(401);

		const newLogin = await makeRequest(server, {
			method: 'POST',
			url: '/auth/login',
			body: {
				email: 'ana@thalyamodas.com',
				password: 'NewPassword1',
			},
		});
		expect(newLogin.statusCode).toBe(200);
	});

	it('deve rejeitar código inválido', async () => {
		await createUser('ana@thalyamodas.com', 'OldPassword1');
		await requestRecoveryCode('ana@thalyamodas.com');

		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/verify-code',
			body: {
				email: 'ana@thalyamodas.com',
				code: '000000',
			},
		});

		expect(response.statusCode).toBe(401);
		expect((response.body as { error: string }).error).toBe(
			'UnauthorizedError',
		);
	});

	it('deve rejeitar código expirado', async () => {
		await createUser('ana@thalyamodas.com', 'OldPassword1');
		const requestResponse = await requestRecoveryCode('ana@thalyamodas.com');
		const code = (requestResponse.body as { debugCode: string }).debugCode;
		const request = await passwordRecoveryRepository.findActiveByEmail(
			'ana@thalyamodas.com',
		);
		if (!request) throw new Error('Recovery request not found');
		await passwordRecoveryRepository.update(request.id, {
			codeExpiresAt: new Date(Date.now() - 1000),
		});

		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/verify-code',
			body: { email: 'ana@thalyamodas.com', code },
		});

		expect(response.statusCode).toBe(401);
		expect((response.body as { error: string }).error).toBe(
			'UnauthorizedError',
		);
	});

	it('deve impedir reutilização de código já usado', async () => {
		await createUser('ana@thalyamodas.com', 'OldPassword1');
		const requestResponse = await requestRecoveryCode('ana@thalyamodas.com');
		const code = (requestResponse.body as { debugCode: string }).debugCode;

		const firstResponse = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/verify-code',
			body: { email: 'ana@thalyamodas.com', code },
		});
		expect(firstResponse.statusCode).toBe(200);

		const secondResponse = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/verify-code',
			body: { email: 'ana@thalyamodas.com', code },
		});
		expect(secondResponse.statusCode).toBe(401);
	});

	it('deve bloquear fluxo após muitas tentativas inválidas', async () => {
		await createUser('ana@thalyamodas.com', 'OldPassword1');
		const requestResponse = await requestRecoveryCode('ana@thalyamodas.com');
		const code = (requestResponse.body as { debugCode: string }).debugCode;

		for (let attempt = 0; attempt < 5; attempt += 1) {
			const response = await makeRequest(server, {
				method: 'POST',
				url: '/auth/password-recovery/verify-code',
				body: { email: 'ana@thalyamodas.com', code: '000000' },
			});
			expect(response.statusCode).toBe(401);
		}

		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/verify-code',
			body: { email: 'ana@thalyamodas.com', code },
		});
		expect(response.statusCode).toBe(401);
	});

	it('deve impedir reenvio antes do cooldown', async () => {
		await createUser('ana@thalyamodas.com', 'OldPassword1');
		await requestRecoveryCode('ana@thalyamodas.com');

		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/resend-code',
			body: { email: 'ana@thalyamodas.com' },
		});

		expect(response.statusCode).toBe(400);
		expect((response.body as { error: string }).error).toBe('DomainError');
		expect(
			(response.body as { details: { retryAfter: number } }).details.retryAfter,
		).toBeGreaterThan(0);
	});

	it('deve reenviar após cooldown, criar novo código e invalidar anterior', async () => {
		await createUser('ana@thalyamodas.com', 'OldPassword1');
		const firstRequest = await requestRecoveryCode('ana@thalyamodas.com');
		const firstCode = (firstRequest.body as { debugCode: string }).debugCode;
		const request = await passwordRecoveryRepository.findActiveByEmail(
			'ana@thalyamodas.com',
		);
		if (!request) throw new Error('Recovery request not found');
		await passwordRecoveryRepository.update(request.id, {
			resendAvailableAt: new Date(Date.now() - 1000),
		});

		const resendResponse = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/resend-code',
			body: { email: 'ana@thalyamodas.com' },
		});
		expect(resendResponse.statusCode).toBe(202);
		const secondCode = (resendResponse.body as { debugCode: string }).debugCode;
		expect(secondCode).toMatch(/^\d{6}$/);

		const oldCodeResponse = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/verify-code',
			body: { email: 'ana@thalyamodas.com', code: firstCode },
		});
		expect(oldCodeResponse.statusCode).toBe(401);

		const newCodeResponse = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/verify-code',
			body: { email: 'ana@thalyamodas.com', code: secondCode },
		});
		expect(newCodeResponse.statusCode).toBe(200);
	});

	it('deve rejeitar reset com senhas diferentes', async () => {
		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/reset',
			body: {
				resetToken: 'a'.repeat(64),
				password: 'NewPassword1',
				passwordConfirmation: 'OtherPassword1',
			},
		});

		expect(response.statusCode).toBe(400);
		expect((response.body as { error: string }).error).toBe('ValidationError');
	});

	it('deve rejeitar reset com senha fraca', async () => {
		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/reset',
			body: {
				resetToken: 'a'.repeat(64),
				password: 'weakpass',
				passwordConfirmation: 'weakpass',
			},
		});

		expect(response.statusCode).toBe(400);
		expect((response.body as { error: string }).error).toBe('ValidationError');
	});

	it('deve rejeitar token inválido no reset', async () => {
		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/reset',
			body: {
				resetToken: 'a'.repeat(64),
				password: 'NewPassword1',
				passwordConfirmation: 'NewPassword1',
			},
		});

		expect(response.statusCode).toBe(401);
		expect((response.body as { error: string }).error).toBe(
			'UnauthorizedError',
		);
	});

	it('deve rejeitar token expirado no reset', async () => {
		await createUser('ana@thalyamodas.com', 'OldPassword1');
		const requestResponse = await requestRecoveryCode('ana@thalyamodas.com');
		const code = (requestResponse.body as { debugCode: string }).debugCode;
		const verifyResponse = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/verify-code',
			body: { email: 'ana@thalyamodas.com', code },
		});
		const resetToken = (verifyResponse.body as { resetToken: string })
			.resetToken;
		const request =
			await passwordRecoveryRepository.findByResetToken(resetToken);
		if (!request) throw new Error('Recovery request not found');
		await passwordRecoveryRepository.update(request.id, {
			resetTokenExpiresAt: new Date(Date.now() - 1000),
		});

		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/reset',
			body: {
				resetToken,
				password: 'NewPassword1',
				passwordConfirmation: 'NewPassword1',
			},
		});

		expect(response.statusCode).toBe(401);
	});

	it('deve impedir reutilização de token já usado', async () => {
		await createUser('ana@thalyamodas.com', 'OldPassword1');
		const requestResponse = await requestRecoveryCode('ana@thalyamodas.com');
		const code = (requestResponse.body as { debugCode: string }).debugCode;
		const verifyResponse = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/verify-code',
			body: { email: 'ana@thalyamodas.com', code },
		});
		const resetToken = (verifyResponse.body as { resetToken: string })
			.resetToken;

		const firstResponse = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/reset',
			body: {
				resetToken,
				password: 'NewPassword1',
				passwordConfirmation: 'NewPassword1',
			},
		});
		expect(firstResponse.statusCode).toBe(200);

		const secondResponse = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/reset',
			body: {
				resetToken,
				password: 'OtherPassword1',
				passwordConfirmation: 'OtherPassword1',
			},
		});
		expect(secondResponse.statusCode).toBe(401);
	});

	it('deve bloquear rotas quando o kill switch global está desligado', async () => {
		await server.close();
		server = await createTestServer(userRepository, {
			featureFlags: { passwordRecovery: false },
		});

		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/request',
			body: { email: 'ana@thalyamodas.com' },
		});

		expect(response.statusCode).toBe(403);
		expect((response.body as { error: string }).error).toBe(
			'FeatureDisabledError',
		);
		expect(
			(response.body as { details: { feature: string } }).details.feature,
		).toBe('passwordRecovery');
	});

	it('deve bloquear request pelo kill switch específico sem criar código', async () => {
		await createUser('ana@thalyamodas.com', 'OldPassword1');
		await recreateServerWithFlags({ 'passwordRecovery.request': false });

		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/request',
			body: { email: 'ana@thalyamodas.com' },
		});

		expect(response.statusCode).toBe(403);
		expect(
			(response.body as { details: { feature: string } }).details.feature,
		).toBe('passwordRecovery.request');
		expect(
			await passwordRecoveryRepository.findActiveByEmail('ana@thalyamodas.com'),
		).toBeNull();
	});

	it('deve bloquear verify-code pelo kill switch específico sem consumir tentativa', async () => {
		await createUser('ana@thalyamodas.com', 'OldPassword1');
		await requestRecoveryCode('ana@thalyamodas.com');
		await recreateServerWithFlags({ 'passwordRecovery.verifyCode': false });

		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/verify-code',
			body: { email: 'ana@thalyamodas.com', code: '000000' },
		});
		const activeRequest = await passwordRecoveryRepository.findActiveByEmail(
			'ana@thalyamodas.com',
		);

		expect(response.statusCode).toBe(403);
		expect(
			(response.body as { details: { feature: string } }).details.feature,
		).toBe('passwordRecovery.verifyCode');
		expect(activeRequest?.invalidAttempts).toBe(0);
	});

	it('deve bloquear resend-code pelo kill switch específico sem invalidar código atual', async () => {
		await createUser('ana@thalyamodas.com', 'OldPassword1');
		const requestResponse = await requestRecoveryCode('ana@thalyamodas.com');
		const code = (requestResponse.body as { debugCode: string }).debugCode;
		await recreateServerWithFlags({ 'passwordRecovery.resendCode': false });

		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/resend-code',
			body: { email: 'ana@thalyamodas.com' },
		});
		const activeRequest = await passwordRecoveryRepository.findActiveByEmail(
			'ana@thalyamodas.com',
		);

		expect(response.statusCode).toBe(403);
		expect(
			(response.body as { details: { feature: string } }).details.feature,
		).toBe('passwordRecovery.resendCode');
		expect(activeRequest?.code).toBe(code);
		expect(activeRequest?.status).toBe('PENDING');
	});

	it('deve bloquear reset pelo kill switch específico sem alterar senha nem consumir token', async () => {
		await createUser('ana@thalyamodas.com', 'OldPassword1');
		const requestResponse = await requestRecoveryCode('ana@thalyamodas.com');
		const code = (requestResponse.body as { debugCode: string }).debugCode;
		const verifyResponse = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/verify-code',
			body: { email: 'ana@thalyamodas.com', code },
		});
		const resetToken = (verifyResponse.body as { resetToken: string })
			.resetToken;
		await recreateServerWithFlags({ 'passwordRecovery.reset': false });

		const response = await makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/reset',
			body: {
				resetToken,
				password: 'NewPassword1',
				passwordConfirmation: 'NewPassword1',
			},
		});
		const activeRequest = await passwordRecoveryRepository.findActiveByEmail(
			'ana@thalyamodas.com',
		);

		expect(response.statusCode).toBe(403);
		expect(
			(response.body as { details: { feature: string } }).details.feature,
		).toBe('passwordRecovery.reset');
		expect(activeRequest?.status).toBe('TOKEN_ISSUED');

		const oldLogin = await makeRequest(server, {
			method: 'POST',
			url: '/auth/login',
			body: {
				email: 'ana@thalyamodas.com',
				password: 'OldPassword1',
			},
		});
		expect(oldLogin.statusCode).toBe(200);
	});

	async function createUser(email: string, password: string) {
		const passwordHash = await passwordHasher.hash(password);
		const user = UserFactory.create({
			email,
			passwordHash,
			accountStatus: AccountStatus.ACTIVE,
		});
		await userRepository.create(user);
		return user;
	}

	async function requestRecoveryCode(email: string) {
		return makeRequest(server, {
			method: 'POST',
			url: '/auth/password-recovery/request',
			body: { email },
		});
	}

	async function recreateServerWithFlags(
		featureFlags: Parameters<typeof createTestServer>[1]['featureFlags'],
	) {
		await server.close();
		server = await createTestServer(userRepository, {
			featureFlags,
			passwordRecoveryRepository,
		});
	}
});
