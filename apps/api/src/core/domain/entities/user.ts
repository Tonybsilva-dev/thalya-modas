export enum UserRole {
	SUPER_ADMIN = 'ROLE_SUPER_ADMIN',
	COMPANY = 'ROLE_COMPANY',
	EMPLOYEE = 'ROLE_EMPLOYEE',
	DELIVERY_MAN = 'ROLE_DELIVERY_MAN',
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
