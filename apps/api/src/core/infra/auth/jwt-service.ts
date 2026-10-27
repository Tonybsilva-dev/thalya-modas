import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { UserRole } from '../../domain/entities/user';
import type { AccessSecurity } from './access-security';

/**
 * Payload do token JWT
 */
export interface JWTPayload {
	userId: string;
	email: string;
	role: UserRole;
	iat?: number;
	jti?: string;
	issuedAt?: number;
	sessionVersion?: string;
	exp?: number;
}

/**
 * Opções para geração de token JWT
 */
export interface JWTGenerateOptions {
	expiresIn?: string | number; // Ex: '1h', '7d', 3600 (segundos)
}

/**
 * Resultado da validação de token
 */
export interface JWTValidationResult {
	valid: boolean;
	payload?: JWTPayload;
	error?: string;
}

/**
 * Serviço para geração e validação de tokens JWT
 */
export class JWTService {
	public security?: AccessSecurity;
	constructor(
		private readonly secret: string,
		private readonly defaultExpiresIn: string = '7d',
	) {
		if (!secret || secret.trim().length === 0) {
			throw new Error('JWT secret must not be empty');
		}

		if (secret.length < 32) {
			throw new Error(
				'JWT secret must be at least 32 characters long for security',
			);
		}
	}

	/**
	 * Gera um token JWT para um usuário
	 * @param payload - Dados do usuário a serem incluídos no token
	 * @param options - Opções adicionais (expiração customizada)
	 * @returns Token JWT assinado
	 */
	generate(
		payload: Omit<JWTPayload, 'iat' | 'exp'>,
		options?: JWTGenerateOptions,
	): string {
		const tokenPayload: JWTPayload = {
			userId: payload.userId,
			email: payload.email,
			role: payload.role,
			jti: randomUUID(),
			issuedAt: Date.now(),
			sessionVersion: payload.sessionVersion,
		};

		const expiresIn = options?.expiresIn || this.defaultExpiresIn;

		// biome-ignore lint/suspicious/noExplicitAny: jsonwebtoken tem tipos complexos para SignOptions
		const signOptions: any = {
			issuer: 'fastify-boilerplate',
		};

		if (expiresIn) {
			signOptions.expiresIn = expiresIn;
		}

		const token = jwt.sign(tokenPayload, this.secret, signOptions);
		const decoded = jwt.decode(token) as JWTPayload;
		if ((decoded.exp ?? 0) - (decoded.iat ?? 0) > 30 * 24 * 3600)
			return jwt.sign(tokenPayload, this.secret, {
				...signOptions,
				expiresIn: 30 * 24 * 3600,
			});
		return token;
	}

	/**
	 * Valida e decodifica um token JWT
	 * @param token - Token JWT a ser validado
	 * @returns Resultado da validação com payload se válido
	 */
	validate(token: string): JWTValidationResult {
		if (!token || token.trim().length === 0) {
			return {
				valid: false,
				error: 'Token is required',
			};
		}

		try {
			const decoded = jwt.verify(token, this.secret, {
				issuer: 'fastify-boilerplate',
			}) as JWTPayload;

			// Valida estrutura do payload
			if (!decoded.userId || !decoded.email || !decoded.role) {
				return {
					valid: false,
					error: 'Invalid token payload structure',
				};
			}

			return {
				valid: true,
				payload: {
					userId: decoded.userId,
					email: decoded.email,
					role: decoded.role,
					jti: decoded.jti,
					issuedAt: decoded.issuedAt,
					sessionVersion: decoded.sessionVersion,
					exp: decoded.exp,
					iat: decoded.iat,
				},
			};
		} catch (error) {
			if (error instanceof jwt.TokenExpiredError) {
				return {
					valid: false,
					error: 'Token has expired',
				};
			}

			if (error instanceof jwt.JsonWebTokenError) {
				return {
					valid: false,
					error: 'Invalid token',
				};
			}

			return {
				valid: false,
				error: 'Token validation failed',
			};
		}
	}

	/**
	 * Decodifica um token sem validar (útil para debug, não usar em produção)
	 * @param token - Token JWT
	 * @returns Payload decodificado ou null se inválido
	 */
	decode(token: string): JWTPayload | null {
		try {
			const decoded = jwt.decode(token) as JWTPayload | null;
			return decoded;
		} catch {
			return null;
		}
	}
}
