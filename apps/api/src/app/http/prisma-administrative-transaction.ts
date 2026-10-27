import type { PrismaClient } from '@prisma/client';
import { PrismaPlanRepository } from '../../core/infra/persistence/prisma/prisma-plan-repository';
import { PrismaStoreRepository } from '../../core/infra/persistence/prisma/prisma-store-repository';
import { PrismaUserRepository } from '../../core/infra/persistence/prisma/prisma-user-repository';
import type { AppContainer } from './container';
export function prismaAdministrativeTransaction(
	prisma: PrismaClient,
): NonNullable<AppContainer['administrativeTransaction']> {
	return (operation) =>
		prisma.$transaction((tx) =>
			operation({
				stores: new PrismaStoreRepository(tx as unknown as PrismaClient, true),
				users: new PrismaUserRepository(tx as unknown as PrismaClient),
				audit: new PrismaPlanRepository(tx as unknown as PrismaClient),
			}),
		);
}
