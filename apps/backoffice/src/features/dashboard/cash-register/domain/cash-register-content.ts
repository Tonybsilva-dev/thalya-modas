export const cashRegisterContent = {
  sidebar: {
    status: "Register open • 04:18",
    operatorRole: "Cashier shift",
  },
  header: {
    title: "Cash register",
    description:
      "Process sales, reconcile payments, manage drawer cash, and close the current shift.",
    searchPlaceholder: "Scan barcode or receipt",
    actionLabel: "Close shift",
  },
  metrics: [
    ["Net sales", "R$ 4.820", "46 receipts", "success"],
    ["Card captured", "R$ 3.210", "Stone batch 0047", "info"],
    ["Cash drawer", "R$ 920", "R$ 40 over float", "warning"],
    ["Open variance", "R$ 0", "Ready to close", "muted"],
  ],
  currentSale: {
    title: "Current sale",
    description: "Receipt #1842 • Marina Costa • Loyalty VIP",
    status: "OPEN",
    rows: [
      ["Vestido midi canelado • M / Preto", "1", "R$ 219", "R$ 219"],
      ["Sandália tiras nude • 36", "1", "R$ 189", "R$ 189"],
      ["Cinto couro fino • Caramelo", "1", "R$ 89", "R$ 89"],
      ["Cupom aniversário", "-", "-R$ 40", "-R$ 40"],
    ],
  },
  paymentMethods: [
    ["Credit card", "R$ 320", "secondary"],
    ["Pix", "R$ 137", "card"],
    ["Cash", "R$ 0", "card"],
  ],
  receipt: {
    label: "Receipt total",
    total: "R$ 457,00",
    actionLabel: "Complete payment",
    rows: [
      ["Subtotal", "R$ 497,00"],
      ["Discount", "-R$ 40,00"],
      ["Paid", "R$ 320,00"],
      ["Remaining", "R$ 137,00"],
    ],
  },
  drawerCount: [
    ["Opening float", "R$ 500"],
    ["Cash sales", "R$ 380"],
    ["Withdrawals", "-R$ 0"],
    ["Expected", "R$ 880"],
  ],
  transactions: [
    ["#1841 • Card", "R$ 219"],
    ["#1840 • Pix", "R$ 148"],
    ["#1839 • Cash", "R$ 92"],
  ],
} as const;
