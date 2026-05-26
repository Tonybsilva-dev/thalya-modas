export const inventoryContent = {
  sidebar: {
    status: "Last sync 2 min ago",
    operatorRole: "Inventory lead",
  },
  header: {
    title: "Inventory",
    description: "Control stock by SKU, size, branch, supplier, and replenishment priority.",
    searchPlaceholder: "Search SKU, product, barcode",
    scanLabel: "Scan",
    actionLabel: "Add item",
  },
  metrics: [
    ["Total units", "3,842", "Across 612 SKUs", "info"],
    ["Below minimum", "42", "14 need supplier order", "warning"],
    ["Pending counts", "8", "Due before 17:00", "muted"],
    ["Stock value", "R$ 186.4k", "+6.2% this month", "success"],
  ],
  filters: [
    ["all", "All items"],
    ["low", "Low stock"],
    ["count", "To count"],
    ["new", "New arrivals"],
    ["online", "Online listed"],
    ["supplier-delay", "Supplier delay"],
  ],
  table: {
    title: "Stock ledger",
    description: "Live quantities by product, variant, channel, and reorder rule.",
    exportLabel: "Export",
    rows: [
      ["Vestido midi canelado • M / Preto", "VD-7712", "6", "2", "Store + Web", "Low"],
      ["Calça pantalona alfaiataria • 40 / Off", "CL-4821", "3", "1", "Store", "Critical"],
      ["Blusa viscose manga curta • G / Azul", "BL-1930", "5", "0", "Store + Web", "Low"],
      ["Jaqueta cropped sarja • P / Verde", "JC-2104", "18", "4", "Web", "Healthy"],
      ["Saia jeans evasê • 38 / Claro", "SJ-5520", "9", "1", "Store", "Watch"],
      ["Sandália tiras nude • 36", "SN-0174", "4", "0", "Store", "Supplier"],
      ["Camisa linho oversized • M / Branco", "CM-8410", "22", "5", "Store + Web", "Healthy"],
      ["Top faixa malha • U / Preto", "TP-3341", "12", "3", "Web", "Count"],
    ],
  },
  bulkActions: {
    selected: "0 selected",
    hint: "Select rows to print tags, transfer units, or create purchase orders.",
  },
  selectedItem: {
    eyebrow: "Selected item",
    name: "Vestido midi canelado",
    description: "VD-7712 • Size M • Preto",
    image:
      "https://images.unsplash.com/photo-1604882767135-b41fac508fff?auto=format&fit=crop&q=80&w=1080",
  },
  reorderPlan: {
    title: "Reorder plan",
    actionLabel: "Create purchase order",
    rows: [
      ["Minimum", "12 units"],
      ["On hand", "6 units"],
      ["Reserved", "2 units"],
      ["Suggested buy", "18 units"],
    ],
  },
  activity: [
    ["Count adjusted", "14:22"],
    ["Online reserve", "13:48"],
    ["Transfer request", "12:31"],
  ],
} as const;
