import type { PrismaClient } from '@prisma/client';
import {
	AccountStatus,
	StoreSegment,
	StoreStatus,
	UserRole,
} from '../../../domain/entities';
import { createStoreBucketKey } from '../../../domain/value-objects/store-slug';
import { Argon2PasswordHasher } from '../../auth/password-hasher';
import { PrismaStoreRepository } from './prisma-store-repository';

const previewUser = {
	name: 'Ana Ribeiro',
	email: 'ana@storeflow.example',
	password: 'Password123',
	role: UserRole.ADMIN,
	accountStatus: AccountStatus.ACTIVE,
} as const;

const previewStore = {
	document: '00000000000191',
	name: 'Store Flow Preview',
	phone: '85999990000',
	segment: StoreSegment.FASHION,
	status: StoreStatus.ACTIVE,
} as const;

export async function seedPreviewUser(prisma: PrismaClient): Promise<void> {
	const passwordHasher = new Argon2PasswordHasher();
	const passwordHash = await passwordHasher.hash(previewUser.password);

	const user = await prisma.user.upsert({
		where: { email: previewUser.email },
		create: {
			name: previewUser.name,
			email: previewUser.email,
			passwordHash,
			role: previewUser.role,
			accountStatus: previewUser.accountStatus,
		},
		update: {
			name: previewUser.name,
			passwordHash,
			role: previewUser.role,
			accountStatus: previewUser.accountStatus,
		},
	});

	const existingStore = await prisma.store.findFirst({
		where: { ownerId: user.id },
	});
	if (existingStore) return;

	const slug = `store-flow-preview-${user.id.replaceAll('-', '').slice(0, 8)}`;
	await new PrismaStoreRepository(prisma).create({
		bucketKey: createStoreBucketKey(slug),
		document: previewStore.document,
		name: previewStore.name,
		ownerId: user.id,
		phone: previewStore.phone,
		segment: previewStore.segment,
		slug,
		status: previewStore.status,
	});
}
