import { NotFoundError } from '../../../../app/http/errors/not-found-error';
import type { UserRepository } from '../../../domain/repositories/user-repository';

/**
 * DTO de entrada para obter usuário atual
 */
export interface GetCurrentUserInput {
	userId: string;
}

/**
 * DTO de saída para usuário atual
 */
export interface GetCurrentUserOutput {
	id: string;
	name: string;
	email: string;
	role: string;
	accountStatus: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Caso de uso: Obter dados do usuário autenticado
 * Busca usuário pelo ID extraído do token JWT
 */
export class GetCurrentUserUseCase {
	constructor(private readonly userRepository: UserRepository) {}

	async execute(input: GetCurrentUserInput): Promise<GetCurrentUserOutput> {
		const user = await this.userRepository.findById(input.userId);

		if (!user) {
			throw new NotFoundError('Usuário não encontrado', {
				details: { userId: input.userId },
			});
		}

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			accountStatus: user.accountStatus,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		};
	}
}
