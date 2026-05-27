export const reportsContent = {
  sidebar: {
    status: "12 reports ready",
    operatorRole: "Manager on duty",
  },
  header: {
    title: "Reports",
    description: "Crie, agende e exporte relatórios operacionais em poucos passos.",
    actions: ["Schedule", "Export", "New report"],
  },
  controls: ["May 2026", "Centro 01", "PDF + CSV"],
  searchPlaceholder: "Buscar relatório ou métrica...",
  metrics: [
    ["84", "Generated", "This month"],
    ["7", "Pending", "Exports"],
    ["23", "Scheduled", "Automations"],
  ],
  catalog: [
    ["Sales & revenue", "Vendas, margem e ticket médio", true],
    ["Inventory movement", "Entradas, saídas e rupturas", false],
    ["Cash register close", "Fechamento, sangrias e divergências", false],
    ["Customers & loyalty", "Clientes, promissórias e recorrência", false],
    ["Suppliers", "Compras, prazos e performance", false],
  ],
  preview: {
    title: "Sales & revenue",
    description: "Preview · May 1-26 · Centro 01",
    status: "Ready to generate",
    chartTitle: "Revenue by week",
    weeks: [
      ["W1", 58],
      ["W2", 82],
      ["W3", 68],
      ["W4", 96],
      ["W5", 74],
    ],
    table: [
      ["Gross sales", "R$ 84.220", "+9.4%"],
      ["Net margin", "38.2%", "+2.5 pts"],
      ["Refunds", "R$ 1.140", "-39.3%"],
    ],
    options: [
      ["Sections", "Summary, charts, table"],
      ["Delivery", "PDF every Monday"],
      ["Source", "POS, inventory, cash"],
    ],
  },
  scheduled: [
    "Daily sales · 7:30",
    "Cash close · Friday",
  ],
  exports: [
    "Sales May · PDF",
    "Promissórias · CSV",
  ],
} as const;
