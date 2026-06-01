export type ErrorLevel = 'info' | 'warning' | 'error' | 'critical';

export type ErrorCategory =
	| 'auth'
	| 'domain'
	| 'feature'
	| 'forbidden'
	| 'internal'
	| 'not-found'
	| 'validation';

export type ErrorDescriptor = {
	code: string;
	acronym: string;
	title: string;
	status: number;
	level: ErrorLevel;
	category: ErrorCategory;
	type: string;
};

const problemTypeBaseUrl = 'https://thalya-modas.local/problems';

export const errorCatalog = {
	AuthError: {
		code: 'TM-AUTH-401',
		acronym: 'AUTH_UNAUTHORIZED',
		title: 'Autenticação necessária',
		status: 401,
		level: 'warning',
		category: 'auth',
		type: `${problemTypeBaseUrl}/auth/unauthorized`,
	},
	UnauthorizedError: {
		code: 'TM-AUTH-401',
		acronym: 'AUTH_UNAUTHORIZED',
		title: 'Autenticação necessária',
		status: 401,
		level: 'warning',
		category: 'auth',
		type: `${problemTypeBaseUrl}/auth/unauthorized`,
	},
	ValidationError: {
		code: 'TM-VAL-400',
		acronym: 'VALIDATION_FAILED',
		title: 'Dados inválidos',
		status: 400,
		level: 'warning',
		category: 'validation',
		type: `${problemTypeBaseUrl}/validation/failed`,
	},
	DomainError: {
		code: 'TM-DOM-400',
		acronym: 'DOMAIN_RULE_FAILED',
		title: 'Regra de negócio não atendida',
		status: 400,
		level: 'warning',
		category: 'domain',
		type: `${problemTypeBaseUrl}/domain/rule-failed`,
	},
	ForbiddenError: {
		code: 'TM-AUTHZ-403',
		acronym: 'ACCESS_FORBIDDEN',
		title: 'Acesso negado',
		status: 403,
		level: 'warning',
		category: 'forbidden',
		type: `${problemTypeBaseUrl}/authz/forbidden`,
	},
	FeatureDisabledError: {
		code: 'TM-FEAT-403',
		acronym: 'FEATURE_DISABLED',
		title: 'Funcionalidade indisponível',
		status: 403,
		level: 'info',
		category: 'feature',
		type: `${problemTypeBaseUrl}/feature/disabled`,
	},
	NotFoundError: {
		code: 'TM-RES-404',
		acronym: 'RESOURCE_NOT_FOUND',
		title: 'Recurso não encontrado',
		status: 404,
		level: 'warning',
		category: 'not-found',
		type: `${problemTypeBaseUrl}/resource/not-found`,
	},
	InternalServerError: {
		code: 'TM-SYS-500',
		acronym: 'INTERNAL_SERVER_ERROR',
		title: 'Erro interno',
		status: 500,
		level: 'error',
		category: 'internal',
		type: `${problemTypeBaseUrl}/internal/server-error`,
	},
} as const satisfies Record<string, ErrorDescriptor>;

export type KnownErrorName = keyof typeof errorCatalog;

export function getErrorDescriptor(errorName: string): ErrorDescriptor {
	return (
		errorCatalog[errorName as KnownErrorName] ??
		errorCatalog.InternalServerError
	);
}
