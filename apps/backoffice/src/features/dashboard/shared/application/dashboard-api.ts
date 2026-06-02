import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/src/shared/api/http-client";

export type DashboardMetricTone = "info" | "muted" | "success" | "warning";

export type DashboardMetric = {
  label: string;
  value: string;
  description: string;
  tone: DashboardMetricTone;
};

export type DashboardRow = Record<string, number | string>;

export type DashboardListQuery = {
  page?: number;
  perPage?: number;
  period?: string | null;
  q?: string | null;
  status?: string | null;
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
    rows: DashboardRow[];
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
  orders: DashboardRow[];
};

export type DashboardInventory = {
  summary: DashboardMetric[];
  products: DashboardRow[];
  movements: DashboardRow[];
};

export type DashboardCustomers = {
  summary: DashboardMetric[];
  customers: DashboardRow[];
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
  stats: DashboardRow[];
  recentOrders: DashboardRow[];
  notes: string[];
  loyaltyTier: {
    title: string;
    description: string;
    progress: number;
  };
  nextActions: string[];
  timeline: DashboardRow[];
};

export type DashboardCustomerPromissory = {
  customerId: string;
  customerName: string;
  alertTitle: string;
  alertDescription: string;
  metrics: DashboardRow[];
  installments: DashboardRow[];
  purchases: DashboardRow[];
  timeline: DashboardRow[];
  risk: {
    label: string;
    value: string;
    description: string;
    progress: number;
  };
};

export type DashboardCashRegister = {
  summary: DashboardMetric[];
  paymentMethods: DashboardRow[];
  currentSale: DashboardRow[];
  closingTasks: DashboardRow[];
};

export type DashboardSuppliers = {
  summary: DashboardMetric[];
  suppliers: DashboardRow[];
  receivings: DashboardRow[];
};

export type DashboardReports = {
  summary: DashboardMetric[];
  reports: DashboardRow[];
  series: Array<{
    name: string;
    values: number[];
  }>;
  periods: string[];
};

const dashboardQueryOptions = {
  staleTime: 30_000,
};

const dashboardListQueryOptions = {
  ...dashboardQueryOptions,
  placeholderData: keepPreviousData,
};

export function useDashboardOverviewQuery() {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => apiRequest<DashboardOverview>("/dashboard/overview"),
    ...dashboardQueryOptions,
  });
}

export function useDashboardOrdersQuery(query?: DashboardListQuery) {
  return useQuery({
    queryKey: ["dashboard", "orders", query],
    queryFn: () => apiRequest<DashboardOrders>(withDashboardQuery("/dashboard/orders", query)),
    ...dashboardListQueryOptions,
  });
}

export function useDashboardInventoryQuery(query?: DashboardListQuery) {
  return useQuery({
    queryKey: ["dashboard", "inventory", query],
    queryFn: () => apiRequest<DashboardInventory>(withDashboardQuery("/dashboard/inventory", query)),
    ...dashboardListQueryOptions,
  });
}

export function useDashboardCustomersQuery(query?: DashboardListQuery) {
  return useQuery({
    queryKey: ["dashboard", "customers", query],
    queryFn: () => apiRequest<DashboardCustomers>(withDashboardQuery("/dashboard/customers", query)),
    ...dashboardListQueryOptions,
  });
}

export function useDashboardCashRegisterQuery() {
  return useQuery({
    queryKey: ["dashboard", "cash-register"],
    queryFn: () => apiRequest<DashboardCashRegister>("/dashboard/cash-register"),
    ...dashboardQueryOptions,
  });
}

export function useDashboardCustomerDetailQuery(customerId: string) {
  return useQuery({
    enabled: Boolean(customerId),
    queryKey: ["dashboard", "customers", customerId],
    queryFn: () => apiRequest<DashboardCustomerDetail>(`/dashboard/customers/${customerId}`),
    ...dashboardQueryOptions,
  });
}

export function useDashboardCustomerPromissoryQuery(customerId: string) {
  return useQuery({
    enabled: Boolean(customerId),
    queryKey: ["dashboard", "customers", customerId, "promissory"],
    queryFn: () =>
      apiRequest<DashboardCustomerPromissory>(`/dashboard/customers/${customerId}/promissory`),
    ...dashboardQueryOptions,
  });
}

export function useDashboardSuppliersQuery(query?: DashboardListQuery) {
  return useQuery({
    queryKey: ["dashboard", "suppliers", query],
    queryFn: () => apiRequest<DashboardSuppliers>(withDashboardQuery("/dashboard/suppliers", query)),
    ...dashboardListQueryOptions,
  });
}

export function useDashboardReportsQuery(query?: DashboardListQuery) {
  return useQuery({
    queryKey: ["dashboard", "reports", query],
    queryFn: () => apiRequest<DashboardReports>(withDashboardQuery("/dashboard/reports", query)),
    ...dashboardListQueryOptions,
  });
}

function withDashboardQuery(path: string, query?: DashboardListQuery) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "all"
    ) {
      params.set(key, String(value));
    }
  }
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}
