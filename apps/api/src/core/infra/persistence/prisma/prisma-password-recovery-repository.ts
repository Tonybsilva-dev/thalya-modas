import type { Prisma, PrismaClient } from '@prisma/client';
import type {
	PasswordRecoveryRequest,
	PasswordRecoveryStatus,
} from '../../../domain/entities/password-recovery';
import type { PasswordRecoveryRepository } from '../../../domain/repositories/password-recovery-repository';

const inactiveStatuses: PasswordRecoveryStatus[] = ['BLOCKED', 'RESET_USED'];

export class PrismaPasswordRecoveryRepository
	implements PasswordRecoveryRepository
{
	constructor(private readonly prisma: PrismaClient) {}

	async create(
		request: Omit<PasswordRecoveryRequest, 'id' | 'createdAt' | 'updatedAt'>,
	): Promise<PasswordRecoveryRequest> {
		const created = await this.prisma.passwordRecoveryRequest.create({
			data: {
				email: request.email,
				userId: request.userId,
				code: request.code,
				codeExpiresAt: request.codeExpiresAt,
				resetToken: request.resetToken,
				resetTokenExpiresAt: request.resetTokenExpiresAt,
				invalidAttempts: request.invalidAttempts,
				resendAvailableAt: request.resendAvailableAt,
				status: request.status,
			},
		});

		return toDomainPasswordRecoveryRequest(created);
	}

	async findActiveByEmail(
		email: string,
	): Promise<PasswordRecoveryRequest | null> {
		const request = await this.prisma.passwordRecoveryRequest.findFirst({
			where: {
				email: email.toLowerCase(),
				status: { notIn: inactiveStatuses },
			},
			orderBy: { createdAt: 'desc' },
		});

		return request ? toDomainPasswordRecoveryRequest(request) : null;
	}

	async findByResetToken(
		resetToken: string,
	): Promise<PasswordRecoveryRequest | null> {
		const request = await this.prisma.passwordRecoveryRequest.findUnique({
			where: { resetToken },
		});

		return request ? toDomainPasswordRecoveryRequest(request) : null;
	}

	async invalidateActiveByEmail(email: string): Promise<void> {
		await this.prisma.passwordRecoveryRequest.updateMany({
			where: {
				email: email.toLowerCase(),
				status: { notIn: inactiveStatuses },
			},
			data: {
				status: 'RESET_USED',
				resetToken: null,
				resetTokenExpiresAt: null,
			},
		});
	}

	async invalidateByUserId(userId: string): Promise<void> {
		await this.prisma.passwordRecoveryRequest.updateMany({
			where: {
				userId,
				status: { notIn: inactiveStatuses },
			},
			data: {
				status: 'RESET_USED',
				resetToken: null,
				resetTokenExpiresAt: null,
			},
		});
	}

	async update(
		id: string,
		request: Partial<
			Omit<PasswordRecoveryRequest, 'id' | 'createdAt' | 'updatedAt'>
		>,
	): Promise<PasswordRecoveryRequest | null> {
		const existing = await this.prisma.passwordRecoveryRequest.findUnique({
			where: { id },
		});
		if (!existing) {
			return null;
		}

		const updated = await this.prisma.passwordRecoveryRequest.update({
			where: { id },
			data: toUpdateInput(request),
		});

		return toDomainPasswordRecoveryRequest(updated);
	}
}

function toUpdateInput(
	request: Partial<
		Omit<PasswordRecoveryRequest, 'id' | 'createdAt' | 'updatedAt'>
	>,
): Prisma.PasswordRecoveryRequestUpdateInput {
	const data: Prisma.PasswordRecoveryRequestUpdateInput = {};

	if (Object.hasOwn(request, 'email')) data.email = request.email;
	if (Object.hasOwn(request, 'userId'))
		data.user = { connect: { id: request.userId } };
	if (Object.hasOwn(request, 'code')) data.code = request.code;
	if (Object.hasOwn(request, 'codeExpiresAt')) {
		data.codeExpiresAt = request.codeExpiresAt;
	}
	if (Object.hasOwn(request, 'resetToken')) {
		data.resetToken = request.resetToken ?? null;
	}
	if (Object.hasOwn(request, 'resetTokenExpiresAt')) {
		data.resetTokenExpiresAt = request.resetTokenExpiresAt ?? null;
	}
	if (Object.hasOwn(request, 'invalidAttempts')) {
		data.invalidAttempts = request.invalidAttempts;
	}
	if (Object.hasOwn(request, 'resendAvailableAt')) {
		data.resendAvailableAt = request.resendAvailableAt;
	}
	if (Object.hasOwn(request, 'status')) data.status = request.status;

	return data;
}

function toDomainPasswordRecoveryRequest(request: {
	id: string;
	email: string;
	userId: string;
	code: string;
	codeExpiresAt: Date;
	resetToken: string | null;
	resetTokenExpiresAt: Date | null;
	invalidAttempts: number;
	resendAvailableAt: Date;
	status: string;
	createdAt: Date;
	updatedAt: Date;
}): PasswordRecoveryRequest {
	return {
		id: request.id,
		email: request.email,
		userId: request.userId,
		code: request.code,
		codeExpiresAt: request.codeExpiresAt,
		resetToken: request.resetToken ?? undefined,
		resetTokenExpiresAt: request.resetTokenExpiresAt ?? undefined,
		invalidAttempts: request.invalidAttempts,
		resendAvailableAt: request.resendAvailableAt,
		status: request.status as PasswordRecoveryStatus,
		createdAt: request.createdAt,
		updatedAt: request.updatedAt,
	};
}
