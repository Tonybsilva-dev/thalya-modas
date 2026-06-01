import { FeatureDisabledError } from '../../app/http/errors/feature-disabled-error';
import { env } from '../env';

export type FeatureKey =
	| 'auth.login'
	| 'auth.register'
	| 'auth.sso'
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
