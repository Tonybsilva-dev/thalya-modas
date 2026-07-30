import type { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { seedPreviewUser } from '../../../../../src/core/infra/persistence/prisma/seed-preview-user';

const previewUserId = '8e88116d-02c9-488a-b624-462e1b1f5e27';

describe('seedPreviewUser', () => {
	it('deve criar uma loja acessível quando o usuário de preview ainda não possui tenant', async () => {
		const prisma = createPrismaMock(null);

		await seedPreviewUser(prisma.client);

		expect(prisma.storeCreate).toHaveBeenCalledWith({
			data: expect.objectContaining({
				bucketKey: 'stores/thalya-modas-preview-8e88116d',
				memberships: {
					create: {
						role: 'OWNER',
						status: 'ACTIVE',
						userId: previewUserId,
					},
				},
				ownerId: previewUserId,
				slug: 'thalya-modas-preview-8e88116d',
				status: 'ACTIVE',
			}),
		});
	});

	it('deve preservar a identidade da loja de preview em reinicializações', async () => {
		const prisma = createPrismaMock({ id: 'existing-store-id' });

		await seedPreviewUser(prisma.client);

		expect(prisma.storeCreate).not.toHaveBeenCalled();
	});
});

function createPrismaMock(existingStore: { id: string } | null) {
	const storeCreate = vi.fn().mockResolvedValue({ id: 'created-store-id' });
	const client = {
		store: {
			create: storeCreate,
			findFirst: vi.fn().mockResolvedValue(existingStore),
		},
		user: {
			upsert: vi.fn().mockResolvedValue({ id: previewUserId }),
		},
	} as unknown as PrismaClient;

	return { client, storeCreate };
}
