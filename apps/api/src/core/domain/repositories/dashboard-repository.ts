import type {
	DashboardCashRegister,
	DashboardCustomerDetail,
	DashboardCustomerPromissory,
	DashboardCustomers,
	DashboardInventory,
	DashboardListQuery,
	DashboardOrders,
	DashboardOverview,
	DashboardReports,
	DashboardSuppliers,
} from '../entities/dashboard';

export interface DashboardRepository {
	getOverview(userId: string): Promise<DashboardOverview>;
	getOrders(
		userId: string,
		query?: DashboardListQuery,
	): Promise<DashboardOrders>;
	getInventory(
		userId: string,
		query?: DashboardListQuery,
	): Promise<DashboardInventory>;
	getCustomers(
		userId: string,
		query?: DashboardListQuery,
	): Promise<DashboardCustomers>;
	getCustomerDetail(
		userId: string,
		customerId: string,
	): Promise<DashboardCustomerDetail>;
	getCustomerPromissory(
		userId: string,
		customerId: string,
	): Promise<DashboardCustomerPromissory>;
	getCashRegister(userId: string): Promise<DashboardCashRegister>;
	getSuppliers(
		userId: string,
		query?: DashboardListQuery,
	): Promise<DashboardSuppliers>;
	getReports(
		userId: string,
		query?: DashboardListQuery,
	): Promise<DashboardReports>;
}
