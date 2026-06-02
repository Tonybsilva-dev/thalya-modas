import { FeatureDisabledError } from '../../app/http/errors/feature-disabled-error';
import { env } from '../env';

export type FeatureKey =
	| 'auth.login'
	| 'auth.register'
	| 'auth.sso'
	| 'dashboard'
	| 'dashboard.cashRegister'
	| 'dashboard.customers'
	| 'dashboard.inventory'
	| 'dashboard.orders'
	| 'dashboard.overview'
	| 'dashboard.reports'
	| 'dashboard.suppliers'
	| 'onboarding'
	| 'passwordRecovery'
	| 'passwordRecovery.request'
	| 'passwordRecovery.resendCode'
	| 'passwordRecovery.reset'
	| 'passwordRecovery.verifyCode';

export type FeatureFlagMap = Record<FeatureKey, boolean>;

export class FeatureFlagService {
	private readonly flags: FeatureFlagMap;

	constructor(overrides: Partial<FeatureFlagMap> = {}) {
		this.flags = {
			'auth.login': env.FEATURE_AUTH_LOGIN_ENABLED,
			'auth.register': env.FEATURE_AUTH_REGISTER_ENABLED,
			'auth.sso': env.FEATURE_AUTH_SSO_ENABLED,
			dashboard: env.FEATURE_DASHBOARD_ENABLED,
			'dashboard.cashRegister': env.FEATURE_DASHBOARD_CASH_REGISTER_ENABLED,
			'dashboard.customers': env.FEATURE_DASHBOARD_CUSTOMERS_ENABLED,
			'dashboard.inventory': env.FEATURE_DASHBOARD_INVENTORY_ENABLED,
			'dashboard.orders': env.FEATURE_DASHBOARD_ORDERS_ENABLED,
			'dashboard.overview': env.FEATURE_DASHBOARD_OVERVIEW_ENABLED,
			'dashboard.reports': env.FEATURE_DASHBOARD_REPORTS_ENABLED,
			'dashboard.suppliers': env.FEATURE_DASHBOARD_SUPPLIERS_ENABLED,
			onboarding: env.FEATURE_ONBOARDING_ENABLED,
			passwordRecovery: env.FEATURE_PASSWORD_RECOVERY_ENABLED,
			'passwordRecovery.request': env.FEATURE_PASSWORD_RECOVERY_REQUEST_ENABLED,
			'passwordRecovery.resendCode':
				env.FEATURE_PASSWORD_RECOVERY_RESEND_CODE_ENABLED,
			'passwordRecovery.reset': env.FEATURE_PASSWORD_RECOVERY_RESET_ENABLED,
			'passwordRecovery.verifyCode':
				env.FEATURE_PASSWORD_RECOVERY_VERIFY_CODE_ENABLED,
			...overrides,
		};
	}

	isEnabled(feature: FeatureKey): boolean {
		return this.flags[feature];
	}

	assertEnabled(feature: FeatureKey): void {
		if (!this.isEnabled(feature)) {
			throw new FeatureDisabledError(feature);
		}
	}
}
