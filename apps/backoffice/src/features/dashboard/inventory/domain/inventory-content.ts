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

export const inventoryContentByLocale = {
  en: inventoryContent,
  "pt-BR": {
    ...inventoryContent,
    sidebar: {
      status: "Ultima sincronizacao ha 2 min",
      operatorRole: "Lider de estoque",
    },
    header: {
      title: "Estoque",
      description: "Controle estoque por SKU, tamanho, filial, fornecedor e prioridade de reposicao.",
      searchPlaceholder: "Buscar SKU, produto, codigo de barras",
      scanLabel: "Escanear",
      actionLabel: "Adicionar item",
    },
    metrics: [
      ["Unidades totais", "3.842", "Em 612 SKUs", "info"],
      ["Abaixo do minimo", "42", "14 precisam de compra", "warning"],
      ["Contagens pendentes", "8", "Vencem antes das 17:00", "muted"],
      ["Valor em estoque", "R$ 186,4 mil", "+6,2% este mes", "success"],
    ],
    filters: [
      ["all", "Todos"],
      ["low", "Baixo estoque"],
      ["count", "Para contar"],
      ["new", "Novidades"],
      ["online", "Listados online"],
      ["supplier-delay", "Atraso fornecedor"],
    ],
    table: {
      ...inventoryContent.table,
      title: "Livro de estoque",
      description: "Quantidades ao vivo por produto, variante, canal e regra de reposicao.",
      exportLabel: "Exportar",
      heads: ["Item", "SKU", "Em maos", "Reservado", "Canal", "Status"],
      rows: [
        ["Vestido midi canelado - M / Preto", "VD-7712", "6", "2", "Loja + Web", "Baixo"],
        ["Calça pantalona alfaiataria - 40 / Off", "CL-4821", "3", "1", "Loja", "Critico"],
        ["Blusa viscose manga curta - G / Azul", "BL-1930", "5", "0", "Loja + Web", "Baixo"],
        ["Jaqueta cropped sarja - P / Verde", "JC-2104", "18", "4", "Web", "Saudavel"],
        ["Saia jeans evase - 38 / Claro", "SJ-5520", "9", "1", "Loja", "Observar"],
        ["Sandalia tiras nude - 36", "SN-0174", "4", "0", "Loja", "Fornecedor"],
        ["Camisa linho oversized - M / Branco", "CM-8410", "22", "5", "Loja + Web", "Saudavel"],
        ["Top faixa malha - U / Preto", "TP-3341", "12", "3", "Web", "Contagem"],
      ],
    },
    bulkActions: {
      selected: "0 selecionados",
      hint: "Selecione linhas para imprimir etiquetas, transferir unidades ou criar pedidos de compra.",
    },
    selectedItem: {
      ...inventoryContent.selectedItem,
      eyebrow: "Item selecionado",
      name: "Vestido midi canelado",
      description: "VD-7712 - Tamanho M - Preto",
    },
    reorderPlan: {
      title: "Plano de reposicao",
      actionLabel: "Criar pedido de compra",
      rows: [
        ["Minimo", "12 unidades"],
        ["Em maos", "6 unidades"],
        ["Reservado", "2 unidades"],
        ["Compra sugerida", "18 unidades"],
      ],
    },
    activity: [
      ["Contagem ajustada", "14:22"],
      ["Reserva online", "13:48"],
      ["Solicitacao de transferencia", "12:31"],
    ],
    labels: {
      recentActivity: "Atividade recente",
    },
  },
  es: {
    ...inventoryContent,
    sidebar: {
      status: "Ultima sincronizacion hace 2 min",
      operatorRole: "Lider de inventario",
    },
    header: {
      title: "Inventario",
      description: "Controla stock por SKU, talla, sucursal, proveedor y prioridad de reposicion.",
      searchPlaceholder: "Buscar SKU, producto, codigo de barras",
      scanLabel: "Escanear",
      actionLabel: "Agregar item",
    },
    metrics: [
      ["Unidades totales", "3.842", "En 612 SKUs", "info"],
      ["Debajo del minimo", "42", "14 necesitan compra", "warning"],
      ["Conteos pendientes", "8", "Vencen antes de 17:00", "muted"],
      ["Valor en stock", "R$ 186,4 mil", "+6,2% este mes", "success"],
    ],
    filters: [
      ["all", "Todos"],
      ["low", "Bajo stock"],
      ["count", "Para contar"],
      ["new", "Novedades"],
      ["online", "Listados online"],
      ["supplier-delay", "Atraso proveedor"],
    ],
    table: {
      ...inventoryContent.table,
      title: "Libro de inventario",
      description: "Cantidades en vivo por producto, variante, canal y regla de reposicion.",
      exportLabel: "Exportar",
      heads: ["Item", "SKU", "Disponible", "Reservado", "Canal", "Estado"],
      rows: [
        ["Vestido midi acanalado - M / Negro", "VD-7712", "6", "2", "Tienda + Web", "Bajo"],
        ["Pantalon sastrero - 40 / Off", "CL-4821", "3", "1", "Tienda", "Critico"],
        ["Blusa viscosa manga corta - G / Azul", "BL-1930", "5", "0", "Tienda + Web", "Bajo"],
        ["Chaqueta cropped sarga - P / Verde", "JC-2104", "18", "4", "Web", "Saludable"],
        ["Falda jeans evase - 38 / Claro", "SJ-5520", "9", "1", "Tienda", "Observar"],
        ["Sandalia tiras nude - 36", "SN-0174", "4", "0", "Tienda", "Proveedor"],
        ["Camisa lino oversized - M / Blanco", "CM-8410", "22", "5", "Tienda + Web", "Saludable"],
        ["Top faja malla - U / Negro", "TP-3341", "12", "3", "Web", "Conteo"],
      ],
    },
    bulkActions: {
      selected: "0 seleccionados",
      hint: "Selecciona filas para imprimir etiquetas, transferir unidades o crear ordenes de compra.",
    },
    selectedItem: {
      ...inventoryContent.selectedItem,
      eyebrow: "Item seleccionado",
      name: "Vestido midi acanalado",
      description: "VD-7712 - Talla M - Negro",
    },
    reorderPlan: {
      title: "Plan de reposicion",
      actionLabel: "Crear orden de compra",
      rows: [
        ["Minimo", "12 unidades"],
        ["Disponible", "6 unidades"],
        ["Reservado", "2 unidades"],
        ["Compra sugerida", "18 unidades"],
      ],
    },
    activity: [
      ["Conteo ajustado", "14:22"],
      ["Reserva online", "13:48"],
      ["Solicitud de transferencia", "12:31"],
    ],
    labels: {
      recentActivity: "Actividad reciente",
    },
  },
} as const;
