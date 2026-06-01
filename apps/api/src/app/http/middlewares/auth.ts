import type { FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import type { JWTService } from '../../../core/infra/auth/jwt-service';
import { getAuthSessionTokenFromCookieHeader } from '../auth-session-cookie';
import { AuthError } from '../errors/auth-error';
import '../types'; // Importa o módulo de declaração para estender FastifyRequest

/**
 * Estende FastifyRequest para incluir dados do usuário autenticado
 */
declare module 'fastify' {
	interface FastifyRequest {
		user?: {
			userId: string;
			email: string;
			role: string;
		};
	}
}

/**
 * Middleware de autenticação JWT.
 * Extrai e valida o token pelo header Authorization ou pelo cookie httpOnly da sessão.
 */
export async function authMiddleware(
	request: FastifyRequest,
	_reply: unknown,
	jwtService: JWTService,
) {
	const requestHeaders = (
		request as { headers?: Record<string, string | string[] | undefined> }
	).headers;
	const authHeader = requestHeaders?.authorization;
	const sessionCookieToken = getAuthSessionTokenFromCookieHeader(
		requestHeaders?.cookie,
	);

	if (!authHeader && !sessionCookieToken) {
		throw new AuthError('Token de autenticação não fornecido');
	}

	const token = authHeader
		? getBearerToken(authHeader)
		: sessionCookieToken;
	if (!token) {
		throw new AuthError('Token de autenticação não fornecido');
	}

	const validation = jwtService.validate(token);

	if (!validation.valid || !validation.payload) {
		throw new AuthError(validation.error || 'Token inválido');
	}

	// Adiciona dados do usuário ao request
	(request as { user?: { userId: string; email: string; role: string } }).user =
		{
			userId: validation.payload.userId,
			email: validation.payload.email,
			role: validation.payload.role,
		};
}

function getBearerToken(authHeader: string | string[]): string {
	if (typeof authHeader !== 'string') {
		throw new AuthError('Formato de token inválido. Use: Bearer <token>');
	}

	const parts = authHeader.split(' ');
	if (parts.length !== 2 || parts[0] !== 'Bearer') {
		throw new AuthError('Formato de token inválido. Use: Bearer <token>');
	}

	return parts[1];
}

/**
 * Plugin Fastify para criar middleware de autenticação
 * @param jwtService - Instância do JWTService
 */
export function createAuthPlugin(jwtService: JWTService) {
	// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
	return fp(async (fastify: any) => {
		// biome-ignore lint/suspicious/noExplicitAny: Fastify 5.x tem problemas de tipos
		(fastify as any).decorate(
			'authenticate',
			async (request: FastifyRequest, _reply: unknown) => {
				await authMiddleware(request, _reply, jwtService);
			},
		);
	});
}
