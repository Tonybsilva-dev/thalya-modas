import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	PrismaStoreRepository,
	PrismaUserRepository,
	prisma,
} from '../../../src/core/infra/persistence';
import {
	createActiveTestStore,
	createTestServer,
	makeRequest,
} from '../helpers';

const runPrismaTests =
	process.env.RUN_PRISMA_INTEGRATION_TESTS === 'true' &&
	Boolean(process.env.DATABASE_URL);

const testEmailPrefix = 'prisma-store-context';

describe.skipIf(!runPrismaTests)(
	'Contexto HTTP de loja - Prisma/Postgres',
	() => {
		let server: FastifyInstance;
		let storeRepository: PrismaStoreRepository;

		beforeEach(async () => {
			await cleanupPrismaRecords();
			storeRepository = new PrismaStoreRepository(prisma);
			server = await createTestServer(new PrismaUserRepository(prisma), {
				storeRepository,
			});
		});

		afterEach(async () => {
			await server.close();
			await cleanupPrismaRecords();
		});

		afterAll(async () => {
			await prisma.$disconnect();
		});

		it('autoriza membro ativo e bloqueia a associação suspensa', async () => {
			const owner = await register('owner');
			const member = await register('member');
			const store = await createActiveTestStore(
				storeRepository,
				owner.userId,
				'Loja compartilhada',
			);
			await prisma.storeMembership.create({
				data: {
					role: 'MANAGER',
					status: 'ACTIVE',
					storeId: store.id,
					userId: member.userId,
				},
			});

			const accesses = await storeRepository.findAccessibleByUserId(
				member.userId,
			);
			expect(accesses).toEqual([
				expect.objectContaining({
					role: 'MANAGER',
					store: expect.objectContaining({ id: store.id }),
				}),
			]);

			const authorized = await getOverview(member.token, store.id);
			expect(authorized.statusCode).toBe(200);
			expect(authorized.headers['x-store-id']).toBe(store.id);

			await prisma.storeMembership.update({
				data: { status: 'SUSPENDED' },
				where: {
					storeId_userId: {
						storeId: store.id,
						userId: member.userId,
					},
				},
			});

			const denied = await getOverview(member.token, store.id);
			expect(denied.statusCode).toBe(403);
			expect(denied.body).toMatchObject({
				code: 'TM-AUTHZ-403',
				error: 'ForbiddenError',
			});
		});

		async function register(label: string) {
			const response = await makeRequest(server, {
				body: {
					email: `${testEmailPrefix}-${label}-${randomUUID()}@thalya.test`,
					name: `Prisma ${label}`,
					password: 'Secure123',
				},
				method: 'POST',
				url: '/auth/register',
			});
			const body = response.body as {
				token: string;
				user: { id: string };
			};

			return { token: body.token, userId: body.user.id };
		}

		function getOverview(token: string, storeId: string) {
			return makeRequest(server, {
				headers: {
					authorization: `Bearer ${token}`,
					'x-store-id': storeId,
				},
				method: 'GET',
				url: '/dashboard/overview',
			});
		}
	},
);

async function cleanupPrismaRecords() {
	await prisma.user.deleteMany({
		where: { email: { startsWith: testEmailPrefix } },
	});
}
