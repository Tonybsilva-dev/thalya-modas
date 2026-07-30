import type { PrismaClient } from '@prisma/client';
import {
	AccountStatus,
	StoreSegment,
	StoreStatus,
	UserRole,
} from '../../../domain/entities';
import { createStoreBucketKey } from '../../../domain/value-objects/store-slug';
import { Argon2PasswordHasher } from '../../auth/password-hasher';

const previewUser = {
	name: 'Ana Ribeiro',
	email: 'ana@thalyamodas.com',
	password: 'Password123',
	role: UserRole.COMPANY,
	accountStatus: AccountStatus.ACTIVE,
} as const;

const previewStore = {
	document: '00000000000191',
	name: 'Thalya Modas Preview',
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

	const slug = `thalya-modas-preview-${user.id.replaceAll('-', '').slice(0, 8)}`;
	await prisma.store.create({
		data: {
			bucketKey: createStoreBucketKey(slug),
			document: previewStore.document,
			memberships: {
				create: {
					role: 'OWNER',
					status: 'ACTIVE',
					userId: user.id,
				},
			},
			name: previewStore.name,
			ownerId: user.id,
			phone: previewStore.phone,
			segment: previewStore.segment,
			slug,
			status: previewStore.status,
		},
	});
}
