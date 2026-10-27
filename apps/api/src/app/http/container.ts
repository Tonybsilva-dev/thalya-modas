import type { PlanAccessService } from '../../core/application/plan-access';
import type { SalesService } from '../../core/application/sales';
import type { CatalogRepository } from '../../core/domain/repositories/catalog-repository';
import type { CustomerRepository } from '../../core/domain/repositories/customer-repository';
import type { DashboardRepository } from '../../core/domain/repositories/dashboard-repository';
import type { OnboardingRepository } from '../../core/domain/repositories/onboarding-repository';
import type { PasswordRecoveryRepository } from '../../core/domain/repositories/password-recovery-repository';
import type { PlanRepository } from '../../core/domain/repositories/plan-repository';
import type { StoreRepository } from '../../core/domain/repositories/store-repository';
import type { UserRepository } from '../../core/domain/repositories/user-repository';
import { AccessSecurity } from '../../core/infra/auth/access-security';
import { JWTService } from '../../core/infra/auth/jwt-service';
import { Argon2PasswordHasher } from '../../core/infra/auth/password-hasher';
import {
	MemorySecurityStore,
	type SecurityStore,
} from '../../core/infra/auth/security-store';
import { env } from '../../shared/env';
import { FeatureFlagService } from '../../shared/features';
export interface AdministrativeRepositories {
	stores: StoreRepository;
	users: UserRepository;
	audit: PlanRepository;
}

/**
 * Container simples de dependências para a camada HTTP
 * Em produção, considere usar um container DI mais robusto (ex: tsyringe, inversify)
 */
export class AppContainer {
	public sales?: SalesService;
	public administrativeTransaction?: <T>(
		operation: (repositories: AdministrativeRepositories) => Promise<T>,
	) => Promise<T>;
	public sendRecoveryCode?: (email: string, code: string) => Promise<void>;
	public readonly security: AccessSecurity;
	public planAccess?: PlanAccessService;
	public readonly featureFlags: FeatureFlagService;
	public readonly jwtService: JWTService;
	public readonly passwordHasher: Argon2PasswordHasher;
	public customerRepository?: CustomerRepository;
	public catalogRepository?: CatalogRepository;
	public dashboardRepository?: DashboardRepository;
	public onboardingRepository?: OnboardingRepository;
	public passwordRecoveryRepository?: PasswordRecoveryRepository;
	public storeRepository?: StoreRepository;
	public userRepository?: UserRepository;

	constructor(
		options: {
			featureFlags?: FeatureFlagService;
			securityStore?: SecurityStore;
		} = {},
	) {
		this.security = new AccessSecurity(
			options.securityStore ?? new MemorySecurityStore(),
		);
		this.featureFlags = options.featureFlags ?? new FeatureFlagService();
		this.jwtService = new JWTService(env.JWT_SECRET, env.JWT_EXPIRES_IN);
		this.jwtService.security = this.security;
		this.passwordHasher = new Argon2PasswordHasher();
	}

	/**
	 * Define o UserRepository (deve ser chamado durante a inicialização)
	 * Em produção, isso seria feito via injeção de dependência
	 */
	setUserRepository(repository: UserRepository): void {
		this.userRepository = repository;
	}

	setCatalogRepository(repository: CatalogRepository): void {
		this.catalogRepository = repository;
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
