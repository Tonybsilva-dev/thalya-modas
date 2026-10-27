import type { Prisma, PrismaClient } from '@prisma/client';
import type { FeatureFlags } from '../../../domain/feature-catalog';
import { type PageQuery, pageResult } from '../../../domain/repositories/page';
import type {
	AuditInput,
	AuditQuery,
	Plan,
	PlanInput,
	PlanRepository,
	TenantPlan,
} from '../../../domain/repositories/plan-repository';
export class PrismaPlanRepository implements PlanRepository {
	constructor(private readonly prisma: PrismaClient) {}
	async listAuditActorIds() {
		return (
			await this.prisma.planAudit.findMany({
				distinct: ['actorId'],
				select: { actorId: true },
			})
		).map((row) => row.actorId);
	}
	async recordAudit(input: AuditInput) {
		await this.prisma.planAudit.create({
			data: { ...input, changes: input.changes as Prisma.InputJsonValue },
		});
	}
	async findAudit(query: AuditQuery) {
		const where: Prisma.PlanAuditWhereInput = {
			action: query.action,
			actorId: query.actorId,
			targetId: query.targetId,
			createdAt: { gte: query.from, lte: query.to },
		};
		const [items, total] = await this.prisma.$transaction([
			this.prisma.planAudit.findMany({
				where,
				orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
				skip: (query.page - 1) * query.perPage,
				take: query.perPage,
			}),
			this.prisma.planAudit.count({ where }),
		]);
		return {
			items,
			total,
			page: query.page,
			perPage: query.perPage,
			totalPages: Math.ceil(total / query.perPage),
		};
	}
	private map(row: {
		id: string;
		name: string;
		description: string;
		status: string;
		priceCents: number | null;
		flags: unknown;
		createdAt: Date;
		updatedAt: Date;
	}): Plan {
		return {
			...row,
			status: row.status as Plan['status'],
			flags: row.flags as FeatureFlags,
		};
	}
	async findPlansPage(query: PageQuery) {
		const where: Prisma.PlanWhereInput = {
			status: query.status,
			OR: query.filter
				? [
						{ name: { contains: query.filter, mode: 'insensitive' } },
						{ description: { contains: query.filter, mode: 'insensitive' } },
					]
				: undefined,
		};
		const [rows, total] = await this.prisma.$transaction([
			this.prisma.plan.findMany({
				where,
				orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
				skip: (query.page - 1) * query.perPage,
				take: query.perPage,
			}),
			this.prisma.plan.count({ where }),
		]);
		return pageResult(
			rows.map((row) => this.map(row)),
			total,
			query,
		);
	}

	async listPlans() {
		return (
			await this.prisma.plan.findMany({ orderBy: { createdAt: 'asc' } })
		).map((row) => this.map(row));
	}
	async findPlan(id: string) {
		const row = await this.prisma.plan.findUnique({ where: { id } });
		return row ? this.map(row) : null;
	}
	async savePlan(id: string | undefined, input: PlanInput, audit: AuditInput) {
		return this.prisma.$transaction(async (tx) => {
			const data = { ...input, flags: input.flags as Prisma.InputJsonValue };
			const row = id
				? await tx.plan.update({ where: { id }, data })
				: await tx.plan.create({ data });
			await tx.planAudit.create({
				data: {
					...audit,
					targetId: row.id,
					changes: audit.changes as Prisma.InputJsonValue,
				},
			});
			return this.map(row);
		});
	}
	async assignedCount(planId: string) {
		return this.prisma.tenant.count({ where: { planId } });
	}
	async getTenantPlan(id: string) {
		const row = await this.prisma.tenant.findUniqueOrThrow({
			where: { id },
			select: { planId: true, featureOverrides: true },
		});
		return {
			planId: row.planId,
			overrides: row.featureOverrides as FeatureFlags,
		};
	}
	async setTenantPlan(id: string, input: TenantPlan, audit: AuditInput) {
		await this.prisma.$transaction([
			this.prisma.tenant.update({
				where: { id },
				data: {
					planId: input.planId,
					featureOverrides: input.overrides as Prisma.InputJsonValue,
				},
			}),
			this.prisma.planAudit.create({
				data: { ...audit, changes: audit.changes as Prisma.InputJsonValue },
			}),
		]);
	}
	async getControls() {
		const row = await this.prisma.platformControls.findUniqueOrThrow({
			where: { id: 'global' },
		});
		return {
			disabledKeys: row.disabledKeys,
			maintenance: row.maintenance,
			updatedAt: row.updatedAt,
		};
	}
	async setControls(
		input: { disabledKeys: string[]; maintenance: boolean },
		audit: AuditInput,
	) {
		const [row] = await this.prisma.$transaction([
			this.prisma.platformControls.update({
				where: { id: 'global' },
				data: input,
			}),
			this.prisma.planAudit.create({
				data: { ...audit, changes: audit.changes as Prisma.InputJsonValue },
			}),
		]);
		return {
			disabledKeys: row.disabledKeys,
			maintenance: row.maintenance,
			updatedAt: row.updatedAt,
		};
	}
	async listAudit() {
		const rows = await this.prisma.planAudit.findMany({
			orderBy: { createdAt: 'desc' },
			take: 100,
		});
		return rows.map((row) => ({ ...row, changes: row.changes as unknown }));
	}
}
