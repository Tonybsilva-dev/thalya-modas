import {
	DEFAULT_PLAN_ID,
	defaultPlanFlags,
} from '../../../domain/feature-catalog';
import { memoryPage, type PageQuery } from '../../../domain/repositories/page';
import type {
	AuditInput,
	AuditQuery,
	Plan,
	PlanAudit,
	PlanInput,
	PlanRepository,
	PlatformControls,
	TenantPlan,
} from '../../../domain/repositories/plan-repository';
export class InMemoryPlanRepository implements PlanRepository {
	async listAuditActorIds() {
		return [...new Set(this.audit.map((row) => row.actorId))];
	}
	async recordAudit(input: AuditInput) {
		this.record(input);
	}
	async findAudit(query: AuditQuery) {
		const rows = this.audit
			.filter(
				(row) =>
					(!query.action || row.action === query.action) &&
					(!query.actorId || row.actorId === query.actorId) &&
					(!query.targetId || row.targetId === query.targetId) &&
					(!query.from || row.createdAt >= query.from) &&
					(!query.to || row.createdAt <= query.to),
			)
			.slice()
			.reverse();
		return {
			items: structuredClone(
				rows.slice(
					(query.page - 1) * query.perPage,
					query.page * query.perPage,
				),
			),
			total: rows.length,
			page: query.page,
			perPage: query.perPage,
			totalPages: Math.ceil(rows.length / query.perPage),
		};
	}
	private plans = new Map<string, Plan>([
		[
			DEFAULT_PLAN_ID,
			{
				id: DEFAULT_PLAN_ID,
				name: 'Starter',
				description: 'Acesso às funcionalidades disponíveis.',
				status: 'PUBLISHED',
				priceCents: null,
				flags: { ...defaultPlanFlags },
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		],
	]);
	private tenants = new Map<string, TenantPlan>();
	private controls: PlatformControls = {
		disabledKeys: [],
		maintenance: false,
		updatedAt: new Date(),
	};
	private audit: PlanAudit[] = [];
	async findPlansPage(query: PageQuery) {
		const rows = (await this.listPlans()).filter(
			(row) =>
				!query.filter ||
				`${row.name} ${row.description}`
					.toLocaleLowerCase()
					.includes(query.filter.toLocaleLowerCase()),
		);
		return memoryPage(rows, { ...query, filter: undefined });
	}

	async listPlans() {
		return structuredClone([...this.plans.values()]);
	}
	async findPlan(id: string) {
		return structuredClone(this.plans.get(id) ?? null);
	}
	async savePlan(id: string | undefined, input: PlanInput, audit: AuditInput) {
		const prior = id ? this.plans.get(id) : undefined;
		const plan: Plan = {
			...structuredClone(input),
			id: id ?? crypto.randomUUID(),
			createdAt: prior?.createdAt ?? new Date(),
			updatedAt: new Date(),
		};
		this.plans.set(plan.id, plan);
		this.record({ ...audit, targetId: plan.id });
		return structuredClone(plan);
	}
	async assignedCount(id: string) {
		return [...this.tenants.values()].filter((t) => t.planId === id).length;
	}
	async getTenantPlan(id: string) {
		return structuredClone(
			this.tenants.get(id) ?? { planId: DEFAULT_PLAN_ID, overrides: {} },
		);
	}
	async setTenantPlan(id: string, input: TenantPlan, audit: AuditInput) {
		this.tenants.set(id, structuredClone(input));
		this.record(audit);
	}
	async getControls() {
		return structuredClone(this.controls);
	}
	async setControls(
		input: Omit<PlatformControls, 'updatedAt'>,
		audit: AuditInput,
	) {
		this.controls = { ...structuredClone(input), updatedAt: new Date() };
		this.record(audit);
		return this.getControls();
	}
	async listAudit() {
		return structuredClone(this.audit.slice(-100).reverse());
	}
	private record(input: AuditInput) {
		this.audit.push({
			...structuredClone(input),
			id: crypto.randomUUID(),
			createdAt: new Date(),
		});
	}
}
