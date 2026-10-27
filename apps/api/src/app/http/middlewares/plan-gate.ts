import type { FastifyRequest } from 'fastify';
import { entryDestination } from '../../../core/application/entry-destination';
import { operationalFeature } from '../../../core/domain/feature-catalog';
import type { AppContainer } from '../container';
import { ForbiddenError } from '../errors/forbidden-error';
export function registerPlanGate(
	app: {
		addHook(
			name: string,
			callback: (route: { url: string; preHandler?: unknown }) => void,
		): unknown;
	},
	container: AppContainer,
) {
	app.addHook('onRoute', (route) => {
		const key = operationalFeature(route.url);
		if (!key) return;
		const existing = route.preHandler;
		route.preHandler = [
			...(Array.isArray(existing) ? existing : existing ? [existing] : []),
			async (request: FastifyRequest) => {
				const store = request.storeContext
					? await container.storeRepository?.findById(
							request.storeContext.storeId,
						)
					: null;
				if (
					store &&
					(await entryDestination(container, store.ownerId, 'ROLE_ADMIN'))
				)
					throw new ForbiddenError(
						'Conclua o onboarding e escolha o plano da empresa antes de usar a loja.',
						{ details: { reason: 'ACTIVATION_REQUIRED' } },
					);
				const service = container.planAccess;
				if (!service) return;
				if (!request.storeContext)
					throw new ForbiddenError('Contexto empresarial obrigatório.');
				const resolved = await service.resolve(request.storeContext.tenantId);
				const feature = resolved.features.find(
					(feature) => feature.key === key,
				);
				if (!feature?.enabled)
					throw new ForbiddenError(
						feature?.reason === 'UNAVAILABLE'
							? 'Este recurso ainda não está disponível no Store Flow.'
							: 'Funcionalidade indisponível para esta empresa.',
						{
							details: {
								feature: key,
								reason: feature?.reason ?? 'UNAVAILABLE',
							},
						},
					);
			},
		];
	});
}
