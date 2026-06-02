export const dashboardNavigation = [
  { i18nKey: "overview", label: "Overview", segment: "" },
  { i18nKey: "orders", label: "Orders", segment: "orders" },
  { i18nKey: "inventory", label: "Inventory", segment: "inventory" },
  { i18nKey: "customers", label: "Customers", segment: "customers" },
  { i18nKey: "cashRegister", label: "Cash register", segment: "cash-register" },
  { i18nKey: "suppliers", label: "Suppliers", segment: "suppliers" },
  { i18nKey: "reports", label: "Reports", segment: "reports" },
  { i18nKey: "about", label: "About", segment: "about" },
] as const;

export type DashboardNavigationLabel = (typeof dashboardNavigation)[number]["label"];
