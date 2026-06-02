import type { PrismaClient } from '@prisma/client';
import { AccountStatus, UserRole } from '../../../domain/entities';
import { Argon2PasswordHasher } from '../../auth/password-hasher';

const previewUser = {
	name: 'Ana Ribeiro',
	email: 'ana@thalyamodas.com',
	password: 'Password123',
	role: UserRole.COMPANY,
	accountStatus: AccountStatus.ACTIVE,
} as const;

export async function seedPreviewUser(prisma: PrismaClient): Promise<void> {
	const passwordHasher = new Argon2PasswordHasher();
	const passwordHash = await passwordHasher.hash(previewUser.password);

	await prisma.user.upsert({
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
}
