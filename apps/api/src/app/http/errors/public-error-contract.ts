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
	| 'TM-AUTH-401'
	| 'TM-VAL-400'
	| 'TM-DOM-400'
	| 'TM-AUTHZ-403'
	| 'TM-FEAT-403'
	| 'TM-RES-404'
	| 'TM-SYS-500';
