export enum TenantStatus {
	ACTIVE = 'ACTIVE',
	SUSPENDED = 'SUSPENDED',
}

export interface Tenant {
	id: string;
	ownerId: string;
	name: string;
	slug: string;
	status: TenantStatus;
	createdAt: Date;
	updatedAt: Date;
}

export interface TenantAccess {
	role: string;
	tenant: Tenant;
}
