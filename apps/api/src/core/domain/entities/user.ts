export enum UserRole {
	SUPER_ADMIN = 'ROLE_SUPER_ADMIN',
	ADMIN = 'ROLE_ADMIN',
	MANAGER = 'ROLE_MANAGER',
	EMPLOYEE = 'ROLE_EMPLOYEE',
	CUSTOMER = 'ROLE_CUSTOMER',
}

export enum AccountStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	SUSPENDED = 'SUSPENDED',
	PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface User {
	id: string;
	name: string;
	email: string;
	passwordHash: string;
	role: UserRole;
	accountStatus: AccountStatus;
	createdAt: Date;
	updatedAt: Date;
}
