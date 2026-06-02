export type DashboardMetricTone = 'info' | 'muted' | 'success' | 'warning';

export type DashboardMetric = {
	label: string;
	value: string;
	description: string;
	tone: DashboardMetricTone;
};

export type DashboardTableRow = Record<string, string | number>;

export type DashboardListQuery = {
	page?: number;
	perPage?: number;
	period?: string;
	q?: string;
	status?: string;
};

export type DashboardOverview = {
	store: {
		name: string;
		status: string;
		operatorName: string;
		operatorRole: string;
	};
	header: {
		title: string;
		description: string;
	};
	metrics: DashboardMetric[];
	salesPulse: {
		title: string;
		description: string;
		status: string;
		hours: string[];
		values: number[];
	};
	spotlight: {
		eyebrow: string;
		name: string;
		description: string;
	};
	inventoryRisk: {
		title: string;
		description: string;
		rows: DashboardTableRow[];
	};
	actionRail: Array<{
		title: string;
		value: string;
		description: string;
		tone: DashboardMetricTone;
	}>;
	checklist: Array<{
		task: string;
		time: string;
	}>;
};

export type DashboardOrders = {
	summary: DashboardMetric[];
	queues: Array<{
		status: string;
		count: number;
		description: string;
	}>;
	orders: DashboardTableRow[];
};

export type DashboardInventory = {
	summary: DashboardMetric[];
	products: DashboardTableRow[];
	movements: DashboardTableRow[];
};

export type DashboardCustomers = {
	summary: DashboardMetric[];
	customers: DashboardTableRow[];
	segments: Array<{
		name: string;
		count: number;
		revenue: string;
	}>;
};

export type DashboardCustomerDetail = {
	id: string;
	name: string;
	description: string;
	email: string;
	phone: string;
	tags: string[];
	stats: DashboardTableRow[];
	recentOrders: DashboardTableRow[];
	notes: string[];
	loyaltyTier: {
		title: string;
		description: string;
		progress: number;
	};
	nextActions: string[];
	timeline: DashboardTableRow[];
};

export type DashboardCustomerPromissory = {
	customerId: string;
	customerName: string;
	alertTitle: string;
	alertDescription: string;
	metrics: DashboardTableRow[];
	installments: DashboardTableRow[];
	purchases: DashboardTableRow[];
	timeline: DashboardTableRow[];
	risk: {
		label: string;
		value: string;
		description: string;
		progress: number;
	};
};

export type DashboardCashRegister = {
	summary: DashboardMetric[];
	paymentMethods: DashboardTableRow[];
	currentSale: DashboardTableRow[];
	closingTasks: DashboardTableRow[];
};

export type DashboardSuppliers = {
	summary: DashboardMetric[];
	suppliers: DashboardTableRow[];
	receivings: DashboardTableRow[];
};

export type DashboardReports = {
	summary: DashboardMetric[];
	reports: DashboardTableRow[];
	series: Array<{
		name: string;
		values: number[];
	}>;
	periods: string[];
};

export type DashboardReadModel =
	| DashboardCashRegister
	| DashboardCustomers
	| DashboardCustomerDetail
	| DashboardCustomerPromissory
	| DashboardInventory
	| DashboardOrders
	| DashboardOverview
	| DashboardReports
	| DashboardSuppliers;
