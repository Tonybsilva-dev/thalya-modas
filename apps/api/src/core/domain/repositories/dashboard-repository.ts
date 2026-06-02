import type {
	DashboardCashRegister,
	DashboardCustomers,
	DashboardInventory,
	DashboardOrders,
	DashboardOverview,
	DashboardReports,
	DashboardSuppliers,
} from '../entities/dashboard';

export interface DashboardRepository {
	getOverview(userId: string): Promise<DashboardOverview>;
	getOrders(userId: string): Promise<DashboardOrders>;
	getInventory(userId: string): Promise<DashboardInventory>;
	getCustomers(userId: string): Promise<DashboardCustomers>;
	getCashRegister(userId: string): Promise<DashboardCashRegister>;
	getSuppliers(userId: string): Promise<DashboardSuppliers>;
	getReports(userId: string): Promise<DashboardReports>;
}
