export const ordersContent = {
  sidebar: {
    status: "12 orders need action",
    operatorRole: "Order desk",
  },
  header: {
    title: "Orders",
    description:
      "Track online pickups, in-store holds, payments, packing status, and customer handoff.",
    searchPlaceholder: "Search order, customer, SKU",
    actionLabel: "New order",
  },
  metrics: [
    ["Open orders", "46", "12 need action", "info"],
    ["Ready pickup", "18", "8 waiting over 2h", "success"],
    ["Payment pending", "7", "R$ 1.420 at risk", "warning"],
    ["Today revenue", "R$ 6.280", "+22% vs yesterday", "muted"],
  ],
  filters: [
    ["all", "All orders"],
    ["ready", "Ready pickup"],
    ["packing", "Packing"],
    ["payment", "Payment pending"],
    ["delivery", "Delivery"],
    ["late", "Late"],
  ],
  table: {
    title: "Order queue",
    description: "Prioritized by customer handoff, payment status and pickup SLA.",
    exportLabel: "Export",
    rows: [
      ["#1842", "Marina Costa", "Store", "R$ 457", "Now", "Packing"],
      ["#1841", "Beatriz Lima", "Web", "R$ 219", "15 min", "Ready"],
      ["#1840", "Camila Rocha", "Pix", "R$ 148", "45 min", "Paid"],
      ["#1839", "Juliana Alves", "Store", "R$ 92", "1h", "Payment"],
      ["#1838", "Rafaela Nunes", "Web", "R$ 310", "2h", "Ready"],
      ["#1837", "Larissa Melo", "Delivery", "R$ 680", "Today", "Courier"],
      ["#1836", "Fernanda Dias", "Web", "R$ 129", "Late", "Late"],
    ],
  },
  bulkActions: {
    selected: "0 selected",
    hint: "Select orders to print receipts, mark ready, or notify customers.",
  },
  selectedOrder: {
    title: "Order #1842",
    description: "Marina Costa • Store pickup",
    meta: [
      ["Total", "R$ 457"],
      ["Items", "3 products"],
      ["SLA", "Ready in 15 min"],
    ],
  },
  packingChecklist: [
    ["Vestido midi canelado", true],
    ["Sandália tiras nude", true],
    ["Cinto couro fino", false],
    ["Gift coupon note", false],
  ],
  nextActions: [
    ["Notify customer", "Message pickup ETA"],
    ["Print receipt", "Attach to shopping bag"],
    ["Mark ready", "Move to pickup shelf"],
  ],
} as const;
