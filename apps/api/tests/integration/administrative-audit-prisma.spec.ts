import { describe, expect, it } from 'vitest';
import { prismaAdministrativeTransaction } from '../../src/app/http/prisma-administrative-transaction';
import { StoreSegment, StoreStatus } from '../../src/core/domain';
import { createStoreBucketKey } from '../../src/core/domain/value-objects/store-slug';
import { prisma } from '../../src/core/infra/persistence/prisma/prisma-client';
import { PrismaPlanRepository } from '../../src/core/infra/persistence/prisma/prisma-plan-repository';

describe.skipIf(process.env.RUN_PRISMA_INTEGRATION_TESTS !== 'true')(
	'Administrative audit transactions',
	() => {
		it('commits branch and audit together and rolls both back on failure', async () => {
			const id = crypto.randomUUID();
			const transact = prismaAdministrativeTransaction(prisma);
			try {
				await prisma.user.create({
					data: {
						id,
						name: 'Audit Fixture',
						email: `audit-${id}@test.local`,
						passwordHash: 'unused',
						role: 'ROLE_ADMIN',
						accountStatus: 'ACTIVE',
					},
				});
				const tenant = await prisma.tenant.create({
					data: { name: 'Audit Fixture', slug: `audit-${id}`, ownerId: id },
				});
				const create = async (fail: boolean) =>
					transact(async ({ stores, audit }) => {
						const slug = `audit-${crypto.randomUUID()}`;
						const branch = await stores.create({
							tenantId: tenant.id,
							ownerId: id,
							name: 'Fixture branch',
							slug,
							bucketKey: createStoreBucketKey(slug),
							phone: '85999999999',
							document: crypto.randomUUID(),
							segment: StoreSegment.MIXED,
							status: StoreStatus.ACTIVE,
						});
						await audit.recordAudit({
							actorId: id,
							targetId: tenant.id,
							action: 'BRANCH_CREATED',
							reason: 'Transaction verification',
							changes: { branchId: branch.id },
						});
						if (fail) throw new Error('Rollback fixture');
						return branch;
					});
				await expect(create(true)).rejects.toThrow('Rollback fixture');
				expect(
					await prisma.store.count({ where: { tenantId: tenant.id } }),
				).toBe(0);
				expect(await prisma.planAudit.count({ where: { actorId: id } })).toBe(
					0,
				);
				const branch = await create(false);
				const history = await new PrismaPlanRepository(prisma).findAudit({
					actorId: id,
					targetId: tenant.id,
					action: 'BRANCH_CREATED',
					page: 1,
					perPage: 20,
				});
				expect(history.total).toBe(1);
				expect(history.items[0].changes).toEqual({ branchId: branch.id });
				expect(
					await prisma.store.count({ where: { tenantId: tenant.id } }),
				).toBe(1);
			} finally {
				await prisma.user.deleteMany({ where: { id } });
				await prisma.planAudit.deleteMany({ where: { actorId: id } });
			}
		});
	},
);
