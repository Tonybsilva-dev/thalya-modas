import type { UserRepository } from '../../core/domain/repositories/user-repository';
import { JWTService } from '../../core/infra/auth/jwt-service';
import { BcryptPasswordHasher } from '../../core/infra/auth/password-hasher';
import { env } from '../../shared/env';

/**
 * Container simples de dependências para a camada HTTP
 * Em produção, considere usar um container DI mais robusto (ex: tsyringe, inversify)
 */
export class AppContainer {
	public readonly jwtService: JWTService;
	public readonly passwordHasher: BcryptPasswordHasher;
	public userRepository?: UserRepository;

	constructor() {
		this.jwtService = new JWTService(env.JWT_SECRET, env.JWT_EXPIRES_IN);
		this.passwordHasher = new BcryptPasswordHasher();
	}

	/**
	 * Define o UserRepository (deve ser chamado durante a inicialização)
	 * Em produção, isso seria feito via injeção de dependência
	 */
	setUserRepository(repository: UserRepository): void {
		this.userRepository = repository;
	}
}
