export type PasswordRecoveryStatus =
	| 'BLOCKED'
	| 'PENDING'
	| 'RESET_USED'
	| 'TOKEN_ISSUED';

export interface PasswordRecoveryRequest {
	id: string;
	email: string;
	userId: string;
	code: string;
	codeExpiresAt: Date;
	resetToken?: string;
	resetTokenExpiresAt?: Date;
	invalidAttempts: number;
	resendAvailableAt: Date;
	status: PasswordRecoveryStatus;
	createdAt: Date;
	updatedAt: Date;
}
