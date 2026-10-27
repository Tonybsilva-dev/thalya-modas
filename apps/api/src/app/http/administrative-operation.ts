import type { AdministrativeRepositories, AppContainer } from './container';
export async function administrativeOperation<T>(
	container: AppContainer,
	operation: (repositories: AdministrativeRepositories) => Promise<T>,
): Promise<T> {
	if (container.administrativeTransaction)
		return container.administrativeTransaction(operation);
	if (
		!container.storeRepository ||
		!container.userRepository ||
		!container.planAccess
	)
		throw new Error('Administrative repositories are not configured.');
	return operation({
		stores: container.storeRepository,
		users: container.userRepository,
		audit: container.planAccess.repository,
	});
}
