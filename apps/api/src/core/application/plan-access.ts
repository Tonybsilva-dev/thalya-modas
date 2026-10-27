import { featureCatalog } from '../domain/feature-catalog';
import type { PlanRepository } from '../domain/repositories/plan-repository';
export class PlanAccessService {
	constructor(public readonly repository: PlanRepository) {}
	async resolve(tenantId: string) {
		const [assignment, controls] = await Promise.all([
			this.repository.getTenantPlan(tenantId),
			this.repository.getControls(),
		]);
		const plan = await this.repository.findPlan(assignment.planId);
		const flags = plan?.flags ?? {};
		const resolve = (key: string) =>
			assignment.overrides[key] ?? flags[key] ?? false;
		const features = featureCatalog.flatMap((module) =>
			module.features.map((feature) => {
				const reason = controls.maintenance
					? 'MAINTENANCE'
					: controls.disabledKeys.includes(module.key) ||
							controls.disabledKeys.includes(feature.key)
						? 'GLOBAL_KILL_SWITCH'
						: !feature.available
							? 'UNAVAILABLE'
							: plan?.status !== 'PUBLISHED'
								? 'PLAN_INACTIVE'
								: !resolve(module.key)
									? 'MODULE_DISABLED'
									: !resolve(feature.key)
										? 'FEATURE_DISABLED'
										: null;
				return {
					key: feature.key,
					module: module.key,
					label: feature.label,
					enabled: reason === null,
					reason,
				};
			}),
		);
		return { plan, overrides: assignment.overrides, features, controls };
	}
}
