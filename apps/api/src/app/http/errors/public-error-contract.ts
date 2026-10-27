import type { ErrorCategory, ErrorLevel } from './error-catalog';

export type ApiProblemDetails = {
	type: string;
	title: string;
	status: number;
	detail: string;
	instance: string;
	code: string;
	acronym: string;
	level: ErrorLevel;
	category: ErrorCategory;
	error: string;
	message: string;
	details?: unknown;
	traceId: string;
	userMessage: string;
};

export type ApiErrorCode =
	| 'SF-AUTH-401'
	| 'SF-VAL-400'
	| 'SF-DOM-400'
	| 'SF-AUTHZ-403'
	| 'SF-FEAT-403'
	| 'SF-RES-404'
	| 'SF-SYS-500';
