import type {
	DashboardCashRegister,
	DashboardCustomers,
	DashboardInventory,
	DashboardOrders,
	DashboardOverview,
	DashboardReports,
	DashboardSuppliers,
} from '../../domain/entities/dashboard';
import type { DashboardRepository } from '../../domain/repositories/dashboard-repository';

export class GetDashboardOverviewUseCase {
	constructor(private readonly dashboardRepository: DashboardRepository) {}

	execute(input: { userId: string }): Promise<DashboardOverview> {
		return this.dashboardRepository.getOverview(input.userId);
	}
}

export class GetDashboardOrdersUseCase {
	constructor(private readonly dashboardRepository: DashboardRepository) {}

	execute(input: { userId: string }): Promise<DashboardOrders> {
		return this.dashboardRepository.getOrders(input.userId);
	}
}

export class GetDashboardInventoryUseCase {
	constructor(private readonly dashboardRepository: DashboardRepository) {}

	execute(input: { userId: string }): Promise<DashboardInventory> {
		return this.dashboardRepository.getInventory(input.userId);
	}
}

export class GetDashboardCustomersUseCase {
	constructor(private readonly dashboardRepository: DashboardRepository) {}

	execute(input: { userId: string }): Promise<DashboardCustomers> {
		return this.dashboardRepository.getCustomers(input.userId);
	}
}

export class GetDashboardCashRegisterUseCase {
	constructor(private readonly dashboardRepository: DashboardRepository) {}

	execute(input: { userId: string }): Promise<DashboardCashRegister> {
		return this.dashboardRepository.getCashRegister(input.userId);
	}
}

export class GetDashboardSuppliersUseCase {
	constructor(private readonly dashboardRepository: DashboardRepository) {}

	execute(input: { userId: string }): Promise<DashboardSuppliers> {
		return this.dashboardRepository.getSuppliers(input.userId);
	}
}

export class GetDashboardReportsUseCase {
	constructor(private readonly dashboardRepository: DashboardRepository) {}

	execute(input: { userId: string }): Promise<DashboardReports> {
		return this.dashboardRepository.getReports(input.userId);
	}
}
