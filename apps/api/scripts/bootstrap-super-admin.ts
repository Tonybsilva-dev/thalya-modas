import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { z } from 'zod';
import { AccountStatus, UserRole } from '../src/core/domain/entities/user';
import { createUserSchema } from '../src/core/domain/schemas/user.schema';
import { Argon2PasswordHasher } from '../src/core/infra/auth/password-hasher';

config({ quiet: true });

const prisma = new PrismaClient();

async function main() {
	const input = z
		.object({
			SUPER_ADMIN_NAME: z.string().trim().min(2),
			SUPER_ADMIN_EMAIL: z
				.string()
				.trim()
				.email()
				.transform((value) => value.toLowerCase()),
			SUPER_ADMIN_PASSWORD: createUserSchema.shape.password,
		})
		.parse(process.env);
	const passwordHash = await new Argon2PasswordHasher().hash(
		input.SUPER_ADMIN_PASSWORD,
	);
	await prisma.$transaction(async (transaction) => {
		// Serialize first-admin provisioning, including concurrent CLI calls.
		await transaction.$executeRaw`SELECT pg_advisory_xact_lock(734102901)`;
		if (
			await transaction.user.findFirst({
				where: { role: UserRole.SUPER_ADMIN },
			})
		) {
			throw new Error(
				'SUPER_ADMIN já provisionado. Este comando cria somente o primeiro.',
			);
		}
		await transaction.user.create({
			data: {
				name: input.SUPER_ADMIN_NAME,
				email: input.SUPER_ADMIN_EMAIL,
				passwordHash,
				role: UserRole.SUPER_ADMIN,
				accountStatus: AccountStatus.ACTIVE,
			},
		});
	});
	console.log(
		'Primeiro SUPER_ADMIN criado. Faça login com as credenciais informadas.',
	);
}

main()
	.catch((error) => {
		console.error(
			error instanceof z.ZodError
				? 'Informe SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL e SUPER_ADMIN_PASSWORD (mínimo de 8 caracteres).'
				: error instanceof Error
					? error.message
					: 'Falha ao provisionar SUPER_ADMIN.',
		);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
