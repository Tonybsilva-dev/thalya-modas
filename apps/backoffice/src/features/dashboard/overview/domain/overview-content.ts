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

export const dashboardOverviewContentByLocale = {
  en: dashboardOverviewContent,
  "pt-BR": {
    ...dashboardOverviewContent,
    store: {
      ...dashboardOverviewContent.store,
      status: "Aberta ate 19:00",
      operatorRole: "Gerente em turno",
    },
    header: {
      title: "Centro de comando da loja",
      description:
        "Segunda, 25 de maio - acompanhe vendas, risco de estoque, retiradas e fechamento de caixa em um so lugar.",
      searchPlaceholder: "Buscar pedido, SKU, cliente",
      newSaleLabel: "Nova venda",
    },
    metrics: [
      {
        label: "Vendas de hoje",
        value: "R$ 4.820",
        description: "+18% vs seg.",
        tone: "success",
      },
      {
        label: "Pedidos abertos",
        value: "26",
        description: "8 aguardando retirada",
        tone: "info",
      },
      {
        label: "SKUs com baixo estoque",
        value: "14",
        description: "5 tamanhos criticos",
        tone: "warning",
      },
      {
        label: "Caixa previsto",
        value: "R$ 7.310",
        description: "Fechar as 19:10",
        tone: "muted",
      },
    ],
    salesPulse: {
      ...dashboardOverviewContent.salesPulse,
      title: "Pulso de vendas",
      description: "Receita por hora do POS e retirada online",
      status: "AO VIVO",
    },
    spotlight: {
      eyebrow: "Item principal",
      name: "Vestido midi canelado",
      description: "18 vendidos hoje - 6 unidades restantes em M e G",
    },
    inventory: {
      title: "Risco de estoque",
      description: "Priorize reposicao antes do pico de demanda da tarde.",
      filter: "Criticos primeiro",
      heads: ["Produto", "SKU", "Estoque", "Demanda", "Acao"],
      rows: [
        ["Calça pantalona alfaiataria", "CL-4821", "3 / 24", "Alta", "Repor"],
        ["Blusa viscose manga curta", "BL-1930", "5 / 40", "Alta", "Transferir"],
        ["Vestido midi canelado", "VD-7712", "6 / 30", "Pico", "Repor"],
        ["Saia jeans evasê", "SJ-5520", "9 / 32", "Media", "Observar"],
        ["Sandália tiras nude", "SN-0174", "4 / 18", "Alta", "Fornecedor"],
      ],
    },
    actionRail: [
      {
        title: "Fila de retirada",
        value: "8 pedidos prontos",
        description: "Avisar clientes aguardando ha mais de 2h",
        tone: "info",
      },
      {
        title: "Fechamento de caixa",
        value: "Diferenca de R$ 490 no cartao",
        description: "Verificar lote Stone 0047",
        tone: "warning",
      },
      {
        title: "Tarefas da equipe",
        value: "3 pendentes",
        description: "Atribuir reset de provador e etiquetagem",
        tone: "success",
      },
    ],
    checklist: [
      ["Confirmar entrega do fornecedor", "10:30"],
      ["Publicar story de novidades", "12:00"],
      ["Recontar vestidos tamanho M", "15:00"],
      ["Fechar caixa e exportar relatorio", "19:10"],
    ],
  },
  es: {
    ...dashboardOverviewContent,
    store: {
      ...dashboardOverviewContent.store,
      status: "Abierta hasta 19:00",
      operatorRole: "Gerente de turno",
    },
    header: {
      title: "Centro de comando de la tienda",
      description:
        "Lunes, 25 de mayo - sigue ventas, riesgo de inventario, retiros y cierre de caja en un solo lugar.",
      searchPlaceholder: "Buscar pedido, SKU, cliente",
      newSaleLabel: "Nueva venta",
    },
    metrics: [
      {
        label: "Ventas de hoy",
        value: "R$ 4.820",
        description: "+18% vs lun.",
        tone: "success",
      },
      {
        label: "Pedidos abiertos",
        value: "26",
        description: "8 esperando retiro",
        tone: "info",
      },
      {
        label: "SKUs con bajo stock",
        value: "14",
        description: "5 talles criticos",
        tone: "warning",
      },
      {
        label: "Caja esperada",
        value: "R$ 7.310",
        description: "Cerrar a las 19:10",
        tone: "muted",
      },
    ],
    salesPulse: {
      ...dashboardOverviewContent.salesPulse,
      title: "Pulso de ventas",
      description: "Ingresos por hora del POS y retiro online",
      status: "EN VIVO",
    },
    spotlight: {
      eyebrow: "Item principal",
      name: "Vestido midi acanalado",
      description: "18 vendidos hoy - 6 unidades restantes en M y G",
    },
    inventory: {
      title: "Riesgo de inventario",
      description: "Prioriza reposicion antes del pico de demanda de la tarde.",
      filter: "Criticos primero",
      heads: ["Producto", "SKU", "Stock", "Demanda", "Accion"],
      rows: [
        ["Pantalon sastrero", "CL-4821", "3 / 24", "Alta", "Reponer"],
        ["Blusa viscosa manga corta", "BL-1930", "5 / 40", "Alta", "Transferir"],
        ["Vestido midi acanalado", "VD-7712", "6 / 30", "Pico", "Reponer"],
        ["Falda jeans evase", "SJ-5520", "9 / 32", "Media", "Observar"],
        ["Sandalia tiras nude", "SN-0174", "4 / 18", "Alta", "Proveedor"],
      ],
    },
    actionRail: [
      {
        title: "Fila de retiro",
        value: "8 pedidos listos",
        description: "Avisar clientes esperando mas de 2h",
        tone: "info",
      },
      {
        title: "Cierre de caja",
        value: "Diferencia de R$ 490 en tarjeta",
        description: "Verificar lote Stone 0047",
        tone: "warning",
      },
      {
        title: "Tareas del equipo",
        value: "3 pendientes",
        description: "Asignar reset de probador y etiquetado",
        tone: "success",
      },
    ],
    checklist: [
      ["Confirmar entrega del proveedor", "10:30"],
      ["Publicar story de novedades", "12:00"],
      ["Recontar vestidos talle M", "15:00"],
      ["Cerrar caja y exportar reporte", "19:10"],
    ],
  },
} as const;

export type OverviewMetricTone =
  (typeof dashboardOverviewContent.metrics)[number]["tone"];
