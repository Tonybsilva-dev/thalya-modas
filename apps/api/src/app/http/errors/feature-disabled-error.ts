import { AppError } from './app-error';

/**
 * Erro para kill switches de funcionalidades desligadas.
 * Status: 403 Forbidden
 */
export class FeatureDisabledError extends AppError {
	constructor(
		feature: string,
		message: string = 'Funcionalidade temporariamente indisponível.',
		options?: {
			traceId?: string;
			cause?: Error;
		},
	) {
		super(message, 403, 'FeatureDisabledError', {
			...options,
			details: { feature },
		});
	}
}
