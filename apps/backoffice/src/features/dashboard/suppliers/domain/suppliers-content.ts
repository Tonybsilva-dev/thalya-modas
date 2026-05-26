export const suppliersContent = {
  sidebar: {
    status: "7 deliveries this week",
    operatorRole: "Supply desk",
  },
  header: {
    title: "Suppliers",
    description:
      "Manage purchase orders, delivery windows, supplier performance, and payment commitments.",
    searchPlaceholder: "Search supplier, PO, invoice",
    actionLabel: "New PO",
  },
  metrics: [
    ["Open POs", "18", "R$ 42.7k committed", "info"],
    ["Due deliveries", "7", "3 arrive today", "success"],
    ["Delayed items", "11", "5 critical SKUs", "warning"],
    ["Payables", "R$ 28.4k", "Next 14 days", "muted"],
  ],
  filters: [
    ["all", "All suppliers"],
    ["due-today", "Due today"],
    ["delayed", "Delayed"],
    ["payable", "Payable"],
    ["top-sellers", "Top sellers"],
    ["new-vendor", "New vendor"],
  ],
  table: {
    title: "Purchase order board",
    description: "Track inbound stock, terms, invoice status, and receiving priority.",
    termsLabel: "Terms",
    rows: [
      ["Bella Textile Co.", "PO-1048", "Today 15:00", "R$ 8.420", "30 days", "Receiving"],
      ["Moda Rio Atacado", "PO-1041", "Tomorrow", "R$ 5.180", "COD", "Delayed"],
      ["Sao Paulo Denim", "PO-1039", "May 29", "R$ 12.900", "45 days", "Confirmed"],
      ["Lume Accessories", "PO-1036", "May 30", "R$ 2.740", "15 days", "Payable"],
      ["Flor de Linho", "PO-1031", "Jun 02", "R$ 6.320", "30 days", "Quoted"],
      ["Nordeste Shoes", "PO-1028", "Jun 04", "R$ 7.880", "30 days", "Confirmed"],
      ["Atelie Canelado", "PO-1022", "Jun 05", "R$ 3.460", "COD", "Delayed"],
    ],
  },
  bulkActions: {
    selected: "0 selected",
    hint: "Select suppliers to schedule receiving, export invoices, or request updated terms.",
  },
  selectedSupplier: {
    name: "Bella Textile Co.",
    description: "Fabrics • Fortaleza route",
    stats: [
      ["On-time rate", "94%"],
      ["Open value", "R$ 8.420"],
      ["Lead time", "4 days"],
    ],
  },
  deliveryPlan: {
    title: "Delivery plan",
    rows: [
      ["ETA", "Today 15:00"],
      ["Boxes", "12 volumes"],
      ["Receiver", "Ana Ribeiro"],
      ["Dock", "Back entrance"],
    ],
  },
  nextActions: [
    "Confirm receiving window",
    "Match invoice NF-8821",
    "Tag urgent SKUs",
  ],
} as const;
