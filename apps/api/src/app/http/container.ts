import type { DashboardRepository } from '../../core/domain/repositories/dashboard-repository';
import type { OnboardingRepository } from '../../core/domain/repositories/onboarding-repository';
import type { PasswordRecoveryRepository } from '../../core/domain/repositories/password-recovery-repository';
import type { StoreRepository } from '../../core/domain/repositories/store-repository';
import type { UserRepository } from '../../core/domain/repositories/user-repository';
import { JWTService } from '../../core/infra/auth/jwt-service';
import { Argon2PasswordHasher } from '../../core/infra/auth/password-hasher';
import { env } from '../../shared/env';
import { FeatureFlagService } from '../../shared/features';

/**
 * Container simples de dependências para a camada HTTP
 * Em produção, considere usar um container DI mais robusto (ex: tsyringe, inversify)
 */
export class AppContainer {
	public readonly featureFlags: FeatureFlagService;
	public readonly jwtService: JWTService;
	public readonly passwordHasher: Argon2PasswordHasher;
	public dashboardRepository?: DashboardRepository;
	public onboardingRepository?: OnboardingRepository;
	public passwordRecoveryRepository?: PasswordRecoveryRepository;
	public storeRepository?: StoreRepository;
	public userRepository?: UserRepository;

	constructor(options: { featureFlags?: FeatureFlagService } = {}) {
		this.featureFlags = options.featureFlags ?? new FeatureFlagService();
		this.jwtService = new JWTService(env.JWT_SECRET, env.JWT_EXPIRES_IN);
		this.passwordHasher = new Argon2PasswordHasher();
	}

	/**
	 * Define o UserRepository (deve ser chamado durante a inicialização)
	 * Em produção, isso seria feito via injeção de dependência
	 */
	setUserRepository(repository: UserRepository): void {
		this.userRepository = repository;
	}

	setDashboardRepository(repository: DashboardRepository): void {
		this.dashboardRepository = repository;
	}

	setPasswordRecoveryRepository(repository: PasswordRecoveryRepository): void {
		this.passwordRecoveryRepository = repository;
	}

	setStoreRepository(repository: StoreRepository): void {
		this.storeRepository = repository;
	}

	setOnboardingRepository(repository: OnboardingRepository): void {
		this.onboardingRepository = repository;
	}
}
