import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
	StoreSegment,
	StoreStatus,
} from '../../../src/core/domain/entities/store';
import {
	PrismaStoreRepository,
	prisma,
} from '../../../src/core/infra/persistence';
import { PrismaCustomerRepository } from '../../../src/core/infra/persistence/prisma/prisma-customer-repository';

describe.skipIf(process.env.RUN_PRISMA_INTEGRATION_TESTS !== 'true')(
	'Commercial customers in PostgreSQL',
	() => {
		it('persists, scopes, rejects duplicates and supports archive and clearing optional fields', async () => {
			const user = await prisma.user.create({
				data: {
					name: 'Customer test owner',
					email: `${randomUUID()}@test.local`,
					passwordHash: 'test-only',
					role: 'ROLE_ADMIN',
					accountStatus: 'ACTIVE',
				},
			});
			try {
				const stores = new PrismaStoreRepository(prisma);
				const createStore = () => {
					const slug = `customer-test-${randomUUID()}`;
					return stores.create({
						ownerId: user.id,
						name: 'Customer test',
						slug,
						bucketKey: `stores/${slug}`,
						phone: '85999990000',
						document: randomUUID(),
						segment: StoreSegment.FASHION,
						status: StoreStatus.ACTIVE,
					});
				};
				const first = await createStore();
				const second = await createStore();
				const repository = new PrismaCustomerRepository(prisma);
				const input = {
					name: 'Commercial customer',
					document: '12345678901',
					status: 'ACTIVE' as const,
					email: 'customer@test.local',
				};
				const customer = await repository.save(first.id, input);
				expect(await repository.find(second.id, customer.id)).toBeNull();
				await expect(repository.save(first.id, input)).rejects.toThrow(
					'Documento já cadastrado',
				);
				await expect(repository.save(second.id, input)).resolves.toMatchObject({
					name: input.name,
				});
				await repository.save(
					first.id,
					{ ...input, status: 'INACTIVE', email: undefined },
					customer.id,
				);
				expect(
					await repository.list(first.id, {
						page: 1,
						perPage: 20,
						status: 'INACTIVE',
						q: 'commercial',
					}),
				).toMatchObject({
					total: 1,
					items: [{ id: customer.id, status: 'INACTIVE', email: undefined }],
				});
				await expect(
					repository.save(second.id, input, customer.id),
				).rejects.toThrow('Cliente não encontrado');
			} finally {
				await prisma.user.delete({ where: { id: user.id } });
			}
		});
	},
);
