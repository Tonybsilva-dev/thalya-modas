import type {
	DashboardCashRegister,
	DashboardCustomers,
	DashboardCustomerDetail,
	DashboardCustomerPromissory,
	DashboardInventory,
	DashboardListQuery,
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

	execute(input: { userId: string; query?: DashboardListQuery }): Promise<DashboardOrders> {
		return this.dashboardRepository.getOrders(input.userId, input.query);
	}
}

export class GetDashboardInventoryUseCase {
	constructor(private readonly dashboardRepository: DashboardRepository) {}

	execute(input: { userId: string; query?: DashboardListQuery }): Promise<DashboardInventory> {
		return this.dashboardRepository.getInventory(input.userId, input.query);
	}
}

export class GetDashboardCustomersUseCase {
	constructor(private readonly dashboardRepository: DashboardRepository) {}

	execute(input: { userId: string; query?: DashboardListQuery }): Promise<DashboardCustomers> {
		return this.dashboardRepository.getCustomers(input.userId, input.query);
	}
}

export class GetDashboardCustomerDetailUseCase {
	constructor(private readonly dashboardRepository: DashboardRepository) {}

	execute(input: { customerId: string; userId: string }): Promise<DashboardCustomerDetail> {
		return this.dashboardRepository.getCustomerDetail(input.userId, input.customerId);
	}
}

export class GetDashboardCustomerPromissoryUseCase {
	constructor(private readonly dashboardRepository: DashboardRepository) {}

	execute(input: { customerId: string; userId: string }): Promise<DashboardCustomerPromissory> {
		return this.dashboardRepository.getCustomerPromissory(input.userId, input.customerId);
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

	execute(input: { userId: string; query?: DashboardListQuery }): Promise<DashboardSuppliers> {
		return this.dashboardRepository.getSuppliers(input.userId, input.query);
	}
}

export class GetDashboardReportsUseCase {
	constructor(private readonly dashboardRepository: DashboardRepository) {}

	execute(input: { userId: string; query?: DashboardListQuery }): Promise<DashboardReports> {
		return this.dashboardRepository.getReports(input.userId, input.query);
	}
}
