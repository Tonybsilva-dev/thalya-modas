import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/src/shared/api/http-client";

export type DashboardMetricTone = "info" | "muted" | "success" | "warning";

export type DashboardMetric = {
  label: string;
  value: string;
  description: string;
  tone: DashboardMetricTone;
};

export type DashboardRow = Record<string, number | string>;

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

export function useDashboardOverviewQuery() {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => apiRequest<DashboardOverview>("/dashboard/overview"),
    ...dashboardQueryOptions,
  });
}

export function useDashboardOrdersQuery() {
  return useQuery({
    queryKey: ["dashboard", "orders"],
    queryFn: () => apiRequest<DashboardOrders>("/dashboard/orders"),
    ...dashboardQueryOptions,
  });
}

export function useDashboardInventoryQuery() {
  return useQuery({
    queryKey: ["dashboard", "inventory"],
    queryFn: () => apiRequest<DashboardInventory>("/dashboard/inventory"),
    ...dashboardQueryOptions,
  });
}

export function useDashboardCustomersQuery() {
  return useQuery({
    queryKey: ["dashboard", "customers"],
    queryFn: () => apiRequest<DashboardCustomers>("/dashboard/customers"),
    ...dashboardQueryOptions,
  });
}

export function useDashboardCashRegisterQuery() {
  return useQuery({
    queryKey: ["dashboard", "cash-register"],
    queryFn: () => apiRequest<DashboardCashRegister>("/dashboard/cash-register"),
    ...dashboardQueryOptions,
  });
}

export function useDashboardSuppliersQuery() {
  return useQuery({
    queryKey: ["dashboard", "suppliers"],
    queryFn: () => apiRequest<DashboardSuppliers>("/dashboard/suppliers"),
    ...dashboardQueryOptions,
  });
}

export function useDashboardReportsQuery() {
  return useQuery({
    queryKey: ["dashboard", "reports"],
    queryFn: () => apiRequest<DashboardReports>("/dashboard/reports"),
    ...dashboardQueryOptions,
  });
}
