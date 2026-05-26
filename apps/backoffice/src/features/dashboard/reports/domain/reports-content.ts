export const reportsContent = {
  sidebar: {
    status: "12 reports ready",
    operatorRole: "Manager on duty",
  },
  header: {
    title: "Reports",
    description:
      "Gere relatórios de vendas, estoque, caixa, clientes, promissórias, fornecedores e performance operacional.",
    actions: ["Schedule", "Export", "New report"],
  },
  filters: [
    "Period: May 2026",
    "Store: Centro 01",
    "Format: PDF + CSV",
    "Channels: All",
  ],
  searchPlaceholder: "Search report templates...",
  metrics: [
    ["Generated this month", "84", "23 scheduled"],
    ["Pending exports", "7", "3 need review"],
    ["Most used", "Sales daily", "42 runs"],
    ["Automations", "12 active", "4 recipients groups"],
  ],
  catalog: [
    [
      "Sales & revenue",
      "Daily, monthly, margin and payment method reports",
      true,
    ],
    ["Inventory movement", "Stock turns, low stock, adjustments and losses", false],
    ["Cash register close", "Cash variance, withdrawals, sangria and close audit", false],
    ["Customers & loyalty", "Retention, birthdays, VIP, promissórias and debt aging", false],
    ["Suppliers & purchasing", "Purchase orders, delivery delays and supplier costs", false],
  ],
  preview: {
    title: "Sales & revenue report",
    description: "Preview for May 1-26, 2026 • Updated 09:42",
    status: "Ready to generate",
    chartTitle: "Revenue by week",
    weeks: [
      ["R$ 12.4k", "W1", 42],
      ["R$ 18.2k", "W2", 64],
      ["R$ 15.7k", "W3", 54],
      ["R$ 21.9k", "W4", 78],
      ["R$ 16.8k", "W5", 58],
    ],
    table: [
      ["Gross sales", "R$ 84.220", "R$ 76.980", "+9.4%"],
      ["Net margin", "38.2%", "35.7%", "+2.5 pts"],
      ["Refunds", "R$ 1.140", "R$ 1.880", "-39.3%"],
    ],
    options: [
      ["Included sections", "Summary, charts, table, comparison, notes"],
      ["Delivery", "Send PDF to managers every Monday"],
      ["Data source", "POS, inventory, customers, cash register"],
    ],
  },
  scheduled: [
    ["Daily sales digest", "Every day 19:15"],
    ["Inventory risk", "Monday 08:00"],
    ["Cash close audit", "Every day 20:00"],
  ],
  exports: [
    ["Sales May 2026", "PDF • 09:42"],
    ["Low stock SKUs", "CSV • Yesterday"],
    ["Promissórias aging", "PDF • May 24"],
    ["Supplier costs", "XLSX • May 22"],
  ],
} as const;
