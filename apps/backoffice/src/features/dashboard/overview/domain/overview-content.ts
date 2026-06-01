export const dashboardOverviewContent = {
  store: {
    name: "Store Flow",
    location: "Centro • Loja 01",
    status: "Open until 19:00",
    operatorInitials: "AR",
    operatorName: "Ana Ribeiro",
    operatorRole: "Manager on duty",
  },
  header: {
    title: "Store command center",
    description:
      "Monday, May 25 • Track sales, inventory risk, pickups, and cash close from one workspace.",
    searchPlaceholder: "Find order, SKU, customer",
    newSaleLabel: "New sale",
  },
  navigation: [
    "Overview",
    "Orders",
    "Inventory",
    "Customers",
    "Cash register",
    "Suppliers",
    "Reports",
  ],
  metrics: [
    {
      label: "Today sales",
      value: "R$ 4.820",
      description: "+18% vs Mon",
      tone: "success",
    },
    {
      label: "Open orders",
      value: "26",
      description: "8 awaiting pickup",
      tone: "info",
    },
    {
      label: "Low stock SKUs",
      value: "14",
      description: "5 critical sizes",
      tone: "warning",
    },
    {
      label: "Cash expected",
      value: "R$ 7.310",
      description: "Close at 19:10",
      tone: "muted",
    },
  ],
  salesPulse: {
    title: "Sales pulse",
    description: "Hourly revenue from POS and online pickup",
    status: "LIVE",
    hours: ["09", "10", "11", "12", "13", "14", "15", "16", "17"],
    bars: [28, 46, 38, 60, 72, 52, 76, 88, 64],
  },
  spotlight: {
    eyebrow: "Top item",
    name: "Vestido midi canelado",
    description: "18 sold today • 6 units left in M and G",
  },
  inventory: {
    title: "Inventory risk",
    description: "Prioritize replenishment before afternoon demand peaks.",
    filter: "Critical first",
    rows: [
      ["Calça pantalona alfaiataria", "CL-4821", "3 / 24", "High", "Reorder"],
      ["Blusa viscose manga curta", "BL-1930", "5 / 40", "High", "Transfer"],
      ["Vestido midi canelado", "VD-7712", "6 / 30", "Peak", "Reorder"],
      ["Saia jeans evasê", "SJ-5520", "9 / 32", "Medium", "Watch"],
      ["Sandália tiras nude", "SN-0174", "4 / 18", "High", "Supplier"],
    ],
  },
  actionRail: [
    {
      title: "Pickup queue",
      value: "8 orders ready",
      description: "Message customers waiting over 2h",
      tone: "info",
    },
    {
      title: "Cash close",
      value: "R$ 490 card gap",
      description: "Check Stone terminal batch 0047",
      tone: "warning",
    },
    {
      title: "Staff tasks",
      value: "3 pending",
      description: "Assign fitting room reset and tagging",
      tone: "success",
    },
  ],
  checklist: [
    ["Confirm supplier delivery", "10:30"],
    ["Post new arrivals story", "12:00"],
    ["Recount size M dresses", "15:00"],
    ["Close cashier and export report", "19:10"],
  ],
} as const;

export type OverviewMetricTone =
  (typeof dashboardOverviewContent.metrics)[number]["tone"];
