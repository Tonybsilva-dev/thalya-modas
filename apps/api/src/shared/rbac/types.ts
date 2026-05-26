import type { AbilityBuilder, MongoAbility } from '@casl/ability';
import type { UserRole } from '../../core/domain';

/**
 * Tipos de ações que podem ser realizadas no sistema
 */
export enum Action {
	MANAGE = 'manage', // Todas as ações
	CREATE = 'create',
	READ = 'read',
	UPDATE = 'update',
	DELETE = 'delete',
}

/**
 * Tipos de recursos/subject que podem ser gerenciados
 */
export enum Subject {
	ALL = 'all', // Todos os recursos
	USER = 'User',
	ADMIN = 'Admin',
}

/**
 * Tipo para definir regras de permissão CASL
 *
 * NOTA: MongoAbility funciona perfeitamente com qualquer banco de dados (PostgreSQL, MySQL, etc.)
 * O nome "Mongo" é apenas histórico - refere-se à sintaxe de query estilo MongoDB,
 * mas não requer MongoDB. É compatível com Prisma e outros ORMs.
 */
export type AppAbility = MongoAbility<[Action, Subject]>;

/**
 * Interface para usuário autenticado usado no RBAC
 * Pode ser uma versão simplificada da entidade User
 */
export interface AuthenticatedUser {
	id: string;
	email: string;
	role: UserRole;
}

/**
 * Tipo helper para criar abilities
 */
export type AbilityBuilderType = AbilityBuilder<AppAbility>;

/**
 * Função que define regras de permissão baseadas no role do usuário
 */
export type DefineRulesFor = (
	user: AuthenticatedUser,
	ability: AbilityBuilderType,
) => void;
