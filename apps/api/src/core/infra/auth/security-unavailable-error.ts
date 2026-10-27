import { AppError } from '../../../app/http/errors/app-error';
export class SecurityUnavailableError extends AppError {
	constructor() {
		super(
			'Não foi possível verificar o acesso agora. Tente novamente em instantes.',
			503,
			'SecurityUnavailableError',
		);
	}
}
