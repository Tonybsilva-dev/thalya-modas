import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { UserRole } from '../../core/domain';
import {
	Action,
	type AppAbility,
	type AuthenticatedUser,
	type DefineRulesFor,
	Subject,
} from './types';

function defineRulesForFullAccess(
	_user: AuthenticatedUser,
	{ can }: AbilityBuilder<AppAbility>,
) {
	can(Action.MANAGE, Subject.ALL);
}

function defineRulesForSelfOnly(
	user: AuthenticatedUser,
	{ can }: AbilityBuilder<AppAbility>,
) {
	// biome-ignore lint/suspicious/noExplicitAny: CASL MongoAbility requer type assertion para condições
	can(Action.READ, Subject.USER, { id: user.id } as any);
	// biome-ignore lint/suspicious/noExplicitAny: CASL MongoAbility requer type assertion para condições
	can(Action.UPDATE, Subject.USER, { id: user.id } as any);
}

const roleRulesMap: Record<UserRole, DefineRulesFor> = {
	[UserRole.SUPER_ADMIN]: defineRulesForFullAccess,
	[UserRole.COMPANY]: defineRulesForFullAccess,
	[UserRole.EMPLOYEE]: defineRulesForSelfOnly,
	[UserRole.DELIVERY_MAN]: defineRulesForSelfOnly,
	[UserRole.CUSTOMER]: defineRulesForSelfOnly,
};

export function createAbilityForUser(user: AuthenticatedUser): AppAbility {
	const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

	const defineRules = roleRulesMap[user.role];

	if (!defineRules) {
		return build();
	}

	const builder = { can };
	// biome-ignore lint/suspicious/noExplicitAny: CASL AbilityBuilder requer type assertion para cannot
	defineRules(user, builder as any);

	return build();
}

export function createEmptyAbility(): AppAbility {
	const { build } = new AbilityBuilder<AppAbility>(createMongoAbility);
	return build();
}
