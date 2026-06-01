export enum OnboardingStatus {
	PENDING = 'PENDING',
	COMPLETED = 'COMPLETED',
}

export enum OnboardingStep {
	STORE_PROFILE = 'STORE_PROFILE',
	STORE_ADDRESS = 'STORE_ADDRESS',
	STORE_PREFERENCES = 'STORE_PREFERENCES',
	COMPLETED = 'COMPLETED',
}

export interface Onboarding {
	id: string;
	userId: string;
	storeId?: string;
	status: OnboardingStatus;
	nextStep: OnboardingStep;
	completedSteps: OnboardingStep[];
	createdAt: Date;
	updatedAt: Date;
}
