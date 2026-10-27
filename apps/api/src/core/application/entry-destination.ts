import type { AppContainer } from '../../app/http/container';
import {
	OnboardingStatus,
	OnboardingStep,
} from '../domain/entities/onboarding';
export async function entryDestination(
	container: AppContainer,
	userId: string,
	role: string,
) {
	if (role !== 'ROLE_ADMIN') return undefined;
	const onboarding = await container.onboardingRepository?.findByUserId(userId);
	if (!onboarding) return undefined;
	if (onboarding.status === OnboardingStatus.COMPLETED)
		return onboarding.completedSteps.includes(OnboardingStep.PLAN_SELECTION)
			? undefined
			: '/onboarding/plan';
	const paths: Record<string, string> = {
		STORE_PROFILE: '/onboarding',
		STORE_ADDRESS: '/onboarding/address',
		STORE_PREFERENCES: '/onboarding/preferences',
	};
	return paths[onboarding.nextStep] ?? '/onboarding';
}
