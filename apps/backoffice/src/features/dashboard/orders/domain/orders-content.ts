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

export const ordersContentByLocale = {
  en: ordersContent,
  "pt-BR": {
    ...ordersContent,
    sidebar: {
      status: "12 pedidos precisam de acao",
      operatorRole: "Mesa de pedidos",
    },
    header: {
      title: "Pedidos",
      description:
        "Acompanhe retiradas online, reservas na loja, pagamentos, separacao e entrega ao cliente.",
      searchPlaceholder: "Buscar pedido, cliente, SKU",
      actionLabel: "Novo pedido",
    },
    metrics: [
      ["Pedidos abertos", "46", "12 precisam de acao", "info"],
      ["Retirada pronta", "18", "8 aguardando ha mais de 2h", "success"],
      ["Pagamento pendente", "7", "R$ 1.420 em risco", "warning"],
      ["Receita de hoje", "R$ 6.280", "+22% vs ontem", "muted"],
    ],
    filters: [
      ["all", "Todos"],
      ["ready", "Retirada pronta"],
      ["packing", "Separacao"],
      ["payment", "Pagamento pendente"],
      ["delivery", "Entrega"],
      ["late", "Atrasados"],
    ],
    table: {
      ...ordersContent.table,
      title: "Fila de pedidos",
      description: "Priorizada por entrega ao cliente, pagamento e SLA de retirada.",
      exportLabel: "Exportar",
      heads: ["Pedido", "Cliente", "Canal", "Total", "Prazo", "Status"],
      rows: [
        ["#1842", "Marina Costa", "Loja", "R$ 457", "Agora", "Separando"],
        ["#1841", "Beatriz Lima", "Web", "R$ 219", "15 min", "Pronto"],
        ["#1840", "Camila Rocha", "Pix", "R$ 148", "45 min", "Pago"],
        ["#1839", "Juliana Alves", "Loja", "R$ 92", "1h", "Pagamento"],
        ["#1838", "Rafaela Nunes", "Web", "R$ 310", "2h", "Pronto"],
        ["#1837", "Larissa Melo", "Entrega", "R$ 680", "Hoje", "Entregador"],
        ["#1836", "Fernanda Dias", "Web", "R$ 129", "Atrasado", "Atrasado"],
      ],
    },
    bulkActions: {
      selected: "0 selecionados",
      hint: "Selecione pedidos para imprimir recibos, marcar como pronto ou avisar clientes.",
    },
    selectedOrder: {
      title: "Pedido #1842",
      description: "Marina Costa - Retirada na loja",
      meta: [
        ["Total", "R$ 457"],
        ["Itens", "3 produtos"],
        ["SLA", "Pronto em 15 min"],
      ],
    },
    packingChecklist: [
      ["Vestido midi canelado", true],
      ["Sandália tiras nude", true],
      ["Cinto couro fino", false],
      ["Bilhete de cupom presente", false],
    ],
    nextActions: [
      ["Avisar cliente", "Enviar previsao de retirada"],
      ["Imprimir recibo", "Anexar a sacola"],
      ["Marcar pronto", "Mover para prateleira de retirada"],
    ],
    labels: {
      packingChecklist: "Checklist de separacao",
      nextActions: "Proximas acoes",
    },
  },
  es: {
    ...ordersContent,
    sidebar: {
      status: "12 pedidos necesitan accion",
      operatorRole: "Mesa de pedidos",
    },
    header: {
      title: "Pedidos",
      description:
        "Sigue retiros online, reservas en tienda, pagos, preparacion y entrega al cliente.",
      searchPlaceholder: "Buscar pedido, cliente, SKU",
      actionLabel: "Nuevo pedido",
    },
    metrics: [
      ["Pedidos abiertos", "46", "12 necesitan accion", "info"],
      ["Retiro listo", "18", "8 esperando mas de 2h", "success"],
      ["Pago pendiente", "7", "R$ 1.420 en riesgo", "warning"],
      ["Ingresos de hoy", "R$ 6.280", "+22% vs ayer", "muted"],
    ],
    filters: [
      ["all", "Todos"],
      ["ready", "Retiro listo"],
      ["packing", "Preparacion"],
      ["payment", "Pago pendiente"],
      ["delivery", "Entrega"],
      ["late", "Atrasados"],
    ],
    table: {
      ...ordersContent.table,
      title: "Fila de pedidos",
      description: "Priorizada por entrega al cliente, pago y SLA de retiro.",
      exportLabel: "Exportar",
      heads: ["Pedido", "Cliente", "Canal", "Total", "Vence", "Estado"],
      rows: [
        ["#1842", "Marina Costa", "Tienda", "R$ 457", "Ahora", "Preparando"],
        ["#1841", "Beatriz Lima", "Web", "R$ 219", "15 min", "Listo"],
        ["#1840", "Camila Rocha", "Pix", "R$ 148", "45 min", "Pagado"],
        ["#1839", "Juliana Alves", "Tienda", "R$ 92", "1h", "Pago"],
        ["#1838", "Rafaela Nunes", "Web", "R$ 310", "2h", "Listo"],
        ["#1837", "Larissa Melo", "Entrega", "R$ 680", "Hoy", "Courier"],
        ["#1836", "Fernanda Dias", "Web", "R$ 129", "Atrasado", "Atrasado"],
      ],
    },
    bulkActions: {
      selected: "0 seleccionados",
      hint: "Selecciona pedidos para imprimir recibos, marcar como listo o avisar clientes.",
    },
    selectedOrder: {
      title: "Pedido #1842",
      description: "Marina Costa - Retiro en tienda",
      meta: [
        ["Total", "R$ 457"],
        ["Items", "3 productos"],
        ["SLA", "Listo en 15 min"],
      ],
    },
    packingChecklist: [
      ["Vestido midi acanalado", true],
      ["Sandalia tiras nude", true],
      ["Cinto cuero fino", false],
      ["Nota de cupon regalo", false],
    ],
    nextActions: [
      ["Avisar cliente", "Enviar ETA de retiro"],
      ["Imprimir recibo", "Adjuntar a la bolsa"],
      ["Marcar listo", "Mover a estante de retiro"],
    ],
    labels: {
      packingChecklist: "Checklist de preparacion",
      nextActions: "Proximas acciones",
    },
  },
} as const;
