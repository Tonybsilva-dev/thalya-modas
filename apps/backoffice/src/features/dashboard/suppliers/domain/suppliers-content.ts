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
    actionLabel: "New supplier",
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

export const suppliersContentByLocale = {
  en: suppliersContent,
  "pt-BR": {
    ...suppliersContent,
    sidebar: { status: "7 entregas esta semana", operatorRole: "Mesa de compras" },
    header: {
      title: "Fornecedores",
      description:
        "Gerencie pedidos de compra, janelas de entrega, performance e compromissos de pagamento.",
      searchPlaceholder: "Buscar fornecedor, pedido, nota",
      actionLabel: "Novo fornecedor",
    },
    metrics: [
      ["Pedidos abertos", "18", "R$ 42,7 mil comprometidos", "info"],
      ["Entregas vencendo", "7", "3 chegam hoje", "success"],
      ["Itens atrasados", "11", "5 SKUs criticos", "warning"],
      ["Contas a pagar", "R$ 28,4 mil", "Proximos 14 dias", "muted"],
    ],
    filters: [
      ["all", "Todos fornecedores"],
      ["due-today", "Vence hoje"],
      ["delayed", "Atrasados"],
      ["payable", "A pagar"],
      ["top-sellers", "Mais vendidos"],
      ["new-vendor", "Novo fornecedor"],
    ],
    table: {
      ...suppliersContent.table,
      title: "Quadro de pedidos de compra",
      description: "Acompanhe estoque a receber, prazos, nota fiscal e prioridade.",
      termsLabel: "Termos",
      heads: ["Fornecedor", "Pedido", "Entrega", "Valor", "Termos", "Status"],
      rows: [
        ["Bella Textile Co.", "PO-1048", "Hoje 15:00", "R$ 8.420", "30 dias", "Recebendo"],
        ["Moda Rio Atacado", "PO-1041", "Amanha", "R$ 5.180", "A vista", "Atrasado"],
        ["Sao Paulo Denim", "PO-1039", "29 mai", "R$ 12.900", "45 dias", "Confirmado"],
        ["Lume Accessories", "PO-1036", "30 mai", "R$ 2.740", "15 dias", "A pagar"],
        ["Flor de Linho", "PO-1031", "02 jun", "R$ 6.320", "30 dias", "Cotado"],
        ["Nordeste Shoes", "PO-1028", "04 jun", "R$ 7.880", "30 dias", "Confirmado"],
        ["Atelie Canelado", "PO-1022", "05 jun", "R$ 3.460", "A vista", "Atrasado"],
      ],
    },
    bulkActions: {
      selected: "0 selecionados",
      hint: "Selecione fornecedores para agendar recebimento, exportar notas ou pedir novos termos.",
    },
    selectedSupplier: {
      name: "Bella Textile Co.",
      description: "Tecidos - Rota Fortaleza",
      stats: [
        ["Pontualidade", "94%"],
        ["Valor aberto", "R$ 8.420"],
        ["Lead time", "4 dias"],
      ],
    },
    deliveryPlan: {
      title: "Plano de entrega",
      rows: [
        ["ETA", "Hoje 15:00"],
        ["Caixas", "12 volumes"],
        ["Recebedor", "Ana Ribeiro"],
        ["Doca", "Entrada dos fundos"],
      ],
    },
    nextActions: ["Confirmar janela de recebimento", "Conferir nota NF-8821", "Etiquetar SKUs urgentes"],
    labels: { nextActions: "Proximas acoes" },
  },
  es: {
    ...suppliersContent,
    sidebar: { status: "7 entregas esta semana", operatorRole: "Mesa de compras" },
    header: {
      title: "Proveedores",
      description:
        "Gestiona ordenes de compra, ventanas de entrega, performance y compromisos de pago.",
      searchPlaceholder: "Buscar proveedor, orden, factura",
      actionLabel: "Nuevo proveedor",
    },
    metrics: [
      ["Ordenes abiertas", "18", "R$ 42,7 mil comprometidos", "info"],
      ["Entregas venciendo", "7", "3 llegan hoy", "success"],
      ["Items atrasados", "11", "5 SKUs criticos", "warning"],
      ["Cuentas por pagar", "R$ 28,4 mil", "Proximos 14 dias", "muted"],
    ],
    filters: [
      ["all", "Todos proveedores"],
      ["due-today", "Vence hoy"],
      ["delayed", "Atrasados"],
      ["payable", "Por pagar"],
      ["top-sellers", "Mas vendidos"],
      ["new-vendor", "Nuevo proveedor"],
    ],
    table: {
      ...suppliersContent.table,
      title: "Tablero de ordenes de compra",
      description: "Sigue stock entrante, plazos, factura y prioridad de recepcion.",
      termsLabel: "Terminos",
      heads: ["Proveedor", "Orden", "Entrega", "Valor", "Terminos", "Estado"],
      rows: [
        ["Bella Textile Co.", "PO-1048", "Hoy 15:00", "R$ 8.420", "30 dias", "Recibiendo"],
        ["Moda Rio Atacado", "PO-1041", "Manana", "R$ 5.180", "Contado", "Atrasado"],
        ["Sao Paulo Denim", "PO-1039", "29 may", "R$ 12.900", "45 dias", "Confirmado"],
        ["Lume Accessories", "PO-1036", "30 may", "R$ 2.740", "15 dias", "Por pagar"],
        ["Flor de Linho", "PO-1031", "02 jun", "R$ 6.320", "30 dias", "Cotizado"],
        ["Nordeste Shoes", "PO-1028", "04 jun", "R$ 7.880", "30 dias", "Confirmado"],
        ["Atelie Canelado", "PO-1022", "05 jun", "R$ 3.460", "Contado", "Atrasado"],
      ],
    },
    bulkActions: {
      selected: "0 seleccionados",
      hint: "Selecciona proveedores para agendar recepcion, exportar facturas o pedir nuevos terminos.",
    },
    selectedSupplier: {
      name: "Bella Textile Co.",
      description: "Telas - Ruta Fortaleza",
      stats: [
        ["Puntualidad", "94%"],
        ["Valor abierto", "R$ 8.420"],
        ["Lead time", "4 dias"],
      ],
    },
    deliveryPlan: {
      title: "Plan de entrega",
      rows: [
        ["ETA", "Hoy 15:00"],
        ["Cajas", "12 volumenes"],
        ["Receptor", "Ana Ribeiro"],
        ["Dock", "Entrada trasera"],
      ],
    },
    nextActions: ["Confirmar ventana de recepcion", "Conciliar factura NF-8821", "Etiquetar SKUs urgentes"],
    labels: { nextActions: "Proximas acciones" },
  },
} as const;
