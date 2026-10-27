import type { FeatureFlags } from '../feature-catalog';
import type { Page, PageQuery } from './page';
export interface Plan {
	id: string;
	name: string;
	description: string;
	status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
	priceCents: number | null;
	flags: FeatureFlags;
	createdAt: Date;
	updatedAt: Date;
}
export type PlanInput = Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>;
export interface PlatformControls {
	disabledKeys: string[];
	maintenance: boolean;
	updatedAt: Date;
}
export interface TenantPlan {
	planId: string;
	overrides: FeatureFlags;
}
export interface PlanAudit {
	id: string;
	actorId: string;
	action: string;
	targetId: string;
	reason: string;
	changes: unknown;
	createdAt: Date;
}
export type AuditInput = Omit<PlanAudit, 'id' | 'createdAt'>;
export interface AuditQuery {
	page: number;
	perPage: number;
	action?: string;
	actorId?: string;
	targetId?: string;
	from?: Date;
	to?: Date;
}
export interface AuditPage {
	items: PlanAudit[];
	total: number;
	page: number;
	perPage: number;
	totalPages: number;
}
export interface PlanRepository {
	findPlansPage(query: PageQuery): Promise<Page<Plan>>;
	listAuditActorIds(): Promise<string[]>;
	recordAudit(input: AuditInput): Promise<void>;
	findAudit(query: AuditQuery): Promise<AuditPage>;
	listPlans(): Promise<Plan[]>;
	findPlan(id: string): Promise<Plan | null>;
	savePlan(
		id: string | undefined,
		input: PlanInput,
		audit: AuditInput,
	): Promise<Plan>;
	assignedCount(id: string): Promise<number>;
	getTenantPlan(tenantId: string): Promise<TenantPlan>;
	setTenantPlan(
		tenantId: string,
		input: TenantPlan,
		audit: AuditInput,
	): Promise<void>;
	getControls(): Promise<PlatformControls>;
	setControls(
		input: Omit<PlatformControls, 'updatedAt'>,
		audit: AuditInput,
	): Promise<PlatformControls>;
	listAudit(): Promise<PlanAudit[]>;
}
