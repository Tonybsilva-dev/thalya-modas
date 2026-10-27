import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { UserRole } from '../../../core/domain/entities/user';
import type { StoreRepository } from '../../../core/domain/repositories/store-repository';
import { DomainError } from '../errors/domain-error';
import { ForbiddenError } from '../errors/forbidden-error';
import { ValidationError } from '../errors/validation-error';
import '../types';

export const activeStoreHeaderName = 'x-store-id';

const activeStoreHeaderSchema = z.object({
	[activeStoreHeaderName]: z
		.string()
		.uuid('X-Store-Id deve conter um UUID válido.'),
});

export async function storeContextMiddleware(
	request: FastifyRequest,
	reply: unknown,
	storeRepository: StoreRepository,
) {
	if (!request.user) {
		throw new Error(
			'O contexto de loja deve ser resolvido após a autenticação.',
		);
	}

	const requestedStoreId = parseRequestedStoreId(request);

	if (
		![
			UserRole.SUPER_ADMIN,
			UserRole.ADMIN,
			UserRole.MANAGER,
			UserRole.EMPLOYEE,
		].includes(request.user.role as UserRole)
	)
		throw new ForbiddenError('Clientes nao tem acesso ao backoffice.');
	if (request.user.role === UserRole.SUPER_ADMIN && requestedStoreId) {
		const store = await storeRepository.findById(requestedStoreId);
		if (!store) throw new ForbiddenError('Loja indisponivel.');
		request.storeContext = {
			role: 'SUPER_ADMIN',
			storeBucketKey: store.bucketKey,
			tenantId: store.tenantId,
			storeId: store.id,
			storeSlug: store.slug,
			userId: request.user.userId,
		};
		(reply as { header?: (name: string, value: string) => unknown }).header?.(
			'X-Store-Id',
			store.id,
		);
		return;
	}
	const accessibleStores = await storeRepository.findAccessibleByUserId(
		request.user.userId,
	);

	const selectedAccess = requestedStoreId
		? accessibleStores.find(({ store }) => store.id === requestedStoreId)
		: resolveFallback(accessibleStores);

	if (!selectedAccess) {
		throw new ForbiddenError('Você não tem acesso à loja informada.', {
			details: { storeId: requestedStoreId },
		});
	}

	const tenant = await storeRepository.findTenantById(
		selectedAccess.store.tenantId,
	);
	if (!tenant || tenant.status !== 'ACTIVE')
		throw new ForbiddenError('Empresa inativa.');
	if (selectedAccess.role === 'CUSTOMER')
		throw new ForbiddenError('Clientes nao tem acesso operacional.');
	if (selectedAccess.store.status !== 'ACTIVE')
		throw new ForbiddenError('Loja inativa.');
	request.storeContext = {
		role: selectedAccess.role,
		storeBucketKey: selectedAccess.store.bucketKey,
		tenantId: selectedAccess.store.tenantId,
		storeId: selectedAccess.store.id,
		storeSlug: selectedAccess.store.slug,
		userId: request.user.userId,
	};

	(
		reply as {
			header?: (name: string, value: string) => unknown;
		}
	).header?.('X-Store-Id', selectedAccess.store.id);
}

function parseRequestedStoreId(request: FastifyRequest): string | undefined {
	const rawHeader = (
		request as {
			headers: Record<string, string | string[] | undefined>;
		}
	).headers[activeStoreHeaderName];
	if (rawHeader === undefined) {
		return undefined;
	}

	const parsed = activeStoreHeaderSchema.safeParse({
		[activeStoreHeaderName]: rawHeader,
	});
	if (!parsed.success) {
		throw ValidationError.fromZodError(parsed.error, {
			traceId: request.traceId,
		});
	}

	return parsed.data[activeStoreHeaderName];
}

function resolveFallback(
	accessibleStores: Awaited<
		ReturnType<StoreRepository['findAccessibleByUserId']>
	>,
) {
	if (accessibleStores.length === 0) {
		throw new ForbiddenError('Nenhuma loja está associada a este usuário.');
	}

	if (accessibleStores.length > 1) {
		throw new DomainError('Informe X-Store-Id para selecionar a loja ativa.', {
			details: {
				accessibleStores: accessibleStores.map(({ store }) => ({
					id: store.id,
					name: store.name,
				})),
			},
		});
	}

	return accessibleStores[0];
}
