import { describe, expect, it } from 'vitest';
import { PlanAccessService } from '../../src/core/application/plan-access';
import { defaultPlanFlags } from '../../src/core/domain/feature-catalog';
import { prisma } from '../../src/core/infra/persistence/prisma/prisma-client';
import { PrismaPlanRepository } from '../../src/core/infra/persistence/prisma/prisma-plan-repository';

describe.skipIf(process.env.RUN_PRISMA_INTEGRATION_TESTS !== 'true')(
	'Persisted plans',
	() => {
		it('persists a plan, tenant assignment, exceptions and audit in PostgreSQL', async () => {
			const repo = new PrismaPlanRepository(prisma);
			const id = crypto.randomUUID();
			let planId: string | undefined;
			try {
				await prisma.user.create({
					data: {
						id,
						name: 'Plan Persistence Test',
						email: `plan-${id}@test.local`,
						passwordHash: 'unused',
						role: 'ROLE_ADMIN',
						accountStatus: 'ACTIVE',
					},
				});
				const tenant = await prisma.tenant.create({
					data: { name: 'Plan Test Company', slug: `plan-${id}`, ownerId: id },
				});
				const audit = {
					actorId: id,
					targetId: tenant.id,
					action: 'TEST',
					reason: 'Persistence test',
					changes: {},
				};
				const plan = await repo.savePlan(
					undefined,
					{
						name: `Plan ${id}`,
						description: 'Test',
						status: 'PUBLISHED',
						priceCents: 12900,
						flags: { ...defaultPlanFlags, 'catalog.images': false },
					},
					audit,
				);
				planId = plan.id;
				const page = await repo.findPlansPage({
					page: 1,
					perPage: 1,
					filter: id,
					status: 'PUBLISHED',
				});
				expect(page).toMatchObject({
					total: 1,
					totalPages: 1,
					items: [{ id: plan.id }],
				});
				expect(
					(await repo.findPlansPage({ page: 2, perPage: 1, filter: id })).items,
				).toHaveLength(0);
				await repo.setTenantPlan(
					tenant.id,
					{ planId: plan.id, overrides: { 'catalog.images': true } },
					audit,
				);
				const fresh = new PrismaPlanRepository(prisma);
				expect(
					(await fresh.getTenantPlan(tenant.id)).overrides['catalog.images'],
				).toBe(true);
				expect((await fresh.findPlan(plan.id))?.priceCents).toBe(12900);
				expect(await fresh.assignedCount(plan.id)).toBe(1);
				const resolution = await new PlanAccessService(fresh).resolve(
					tenant.id,
				);
				expect(resolution.plan?.id).toBe(plan.id);
				expect(await prisma.planAudit.count({ where: { actorId: id } })).toBe(
					2,
				);
			} finally {
				await prisma.user.deleteMany({ where: { id } });
				if (planId) await prisma.plan.deleteMany({ where: { id: planId } });
				await prisma.planAudit.deleteMany({ where: { actorId: id } });
			}
		});
	},
);
