export const dashboardNavigation = [
  { label: "Overview", segment: "" },
  { label: "Orders", segment: "orders" },
  { label: "Inventory", segment: "inventory" },
  { label: "Customers", segment: "customers" },
  { label: "Cash register", segment: "cash-register" },
  { label: "Suppliers", segment: "suppliers" },
  { label: "Reports", segment: "reports" },
  { label: "About", segment: "about" },
] as const;

export type DashboardNavigationLabel = (typeof dashboardNavigation)[number]["label"];
