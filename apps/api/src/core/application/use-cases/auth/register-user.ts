import { DomainError } from '../../../../app/http/errors/domain-error';
import { ForbiddenError } from '../../../../app/http/errors/forbidden-error';
import { AccountStatus, UserRole } from '../../../domain/entities/user';
import type { UserRepository } from '../../../domain/repositories/user-repository';
import { createUserSchema } from '../../../domain/schemas/user.schema';
import type { PasswordHasher } from '../../../domain/value-objects/password';
import { Password } from '../../../domain/value-objects/password';
import type { JWTService } from '../../../infra/auth/jwt-service';

export interface RegisterUserInput {
	name: string;
	email: string;
	password: string;
	role?: UserRole;
	accountStatus?: AccountStatus;
	actor?: { id: string; role: UserRole };
}

export interface RegisterUserOutput {
	user: {
		id: string;
		name: string;
		email: string;
		role: UserRole;
		accountStatus: AccountStatus;
		createdAt: Date;
		updatedAt: Date;
	};
	token: string;
}

export class RegisterUserUseCase {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly passwordHasher: PasswordHasher,
		private readonly jwtService: JWTService,
	) {}

	async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
		const requestedRole = input.role ?? UserRole.CUSTOMER;

		if (requestedRole === UserRole.SUPER_ADMIN) {
			throw new ForbiddenError(
				'Cadastro de Super Admin não permitido por esta rota.',
			);
		}

		if (requestedRole === UserRole.COMPANY) {
			if (input.actor?.role !== UserRole.SUPER_ADMIN) {
				throw new ForbiddenError(
					'Apenas Super Admin pode cadastrar Company (estabelecimento).',
				);
			}
		} else if (
			requestedRole === UserRole.EMPLOYEE ||
			requestedRole === UserRole.DELIVERY_MAN
		) {
			if (input.actor?.role !== UserRole.COMPANY) {
				throw new ForbiddenError(
					'Apenas Company (estabelecimento) pode cadastrar empregados e entregadores.',
				);
			}
		}

		const validatedData = createUserSchema.parse({
			name: input.name,
			email: input.email,
			password: input.password,
			role: requestedRole,
			accountStatus: input.accountStatus || AccountStatus.ACTIVE,
		});

		const existingUser = await this.userRepository.findByEmail(
			validatedData.email,
		);
		if (existingUser) {
			throw new DomainError('Email já está em uso', {
				details: { email: validatedData.email },
			});
		}

		const password = await Password.fromPlain(
			validatedData.password,
			this.passwordHasher,
		);

		const user = await this.userRepository.create({
			name: validatedData.name,
			email: validatedData.email,
			passwordHash: password.hash,
			role: validatedData.role,
			accountStatus: validatedData.accountStatus || AccountStatus.ACTIVE,
		});

		const token = this.jwtService.generate({
			userId: user.id,
			email: user.email,
			role: user.role,
		});

		return {
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				accountStatus: user.accountStatus,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			},
			token,
		};
	}
}
