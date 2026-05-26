import { z } from 'zod';
import { AccountStatus, UserRole } from '../entities/user';
import { Name } from '../value-objects/name';

export const userSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(2),
	email: z.string().email(),
	passwordHash: z.string().min(1),
	role: z.nativeEnum(UserRole),
	accountStatus: z.nativeEnum(AccountStatus),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type UserSchema = z.infer<typeof userSchema>;

export const createUserSchema = userSchema
	.omit({ id: true, createdAt: true, updatedAt: true, passwordHash: true })
	.extend({
		name: z
			.string()
			.min(1)
			.transform((s) => {
				try {
					return Name.fromRaw(s).value;
				} catch (e) {
					throw new z.ZodError([
						{
							code: 'custom',
							path: ['name'],
							message: e instanceof Error ? e.message : 'Nome inválido',
						},
					]);
				}
			}),
		password: z.string().min(8),
	})
	.partial({ accountStatus: true });

export type CreateUserSchema = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.partial();

export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
