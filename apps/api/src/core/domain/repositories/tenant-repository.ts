import type { Tenant, TenantAccess, TenantStatus } from '../entities/tenant';

export interface TenantRepository {
	findTenantUserIds(tenantId: string): Promise<string[]>;
	createTenant(input: {
		name: string;
		ownerId: string;
		slug: string;
	}): Promise<Tenant>;
	findTenantById(id: string): Promise<Tenant | null>;
	findAllTenants(): Promise<Tenant[]>;
	findTenantsByUserId(userId: string): Promise<TenantAccess[]>;
	findAssociatedTenantIds(userId: string): Promise<string[]>;
	updateTenant(
		id: string,
		input: { name?: string; status?: TenantStatus },
	): Promise<Tenant>;
	addTenantMember(
		tenantId: string,
		userId: string,
		role: string,
	): Promise<void>;
}
