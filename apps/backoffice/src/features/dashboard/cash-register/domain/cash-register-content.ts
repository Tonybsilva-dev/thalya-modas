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

export const cashRegisterContentByLocale = {
  en: cashRegisterContent,
  "pt-BR": {
    ...cashRegisterContent,
    sidebar: { status: "Caixa aberto - 04:18", operatorRole: "Turno de caixa" },
    header: {
      title: "Caixa",
      description:
        "Processe vendas, concilie pagamentos, gerencie dinheiro e feche o turno atual.",
      searchPlaceholder: "Escanear codigo ou recibo",
      actionLabel: "Fechar turno",
    },
    metrics: [
      ["Vendas liquidas", "R$ 4.820", "46 recibos", "success"],
      ["Cartao capturado", "R$ 3.210", "Lote Stone 0047", "info"],
      ["Gaveta", "R$ 920", "R$ 40 acima do fundo", "warning"],
      ["Divergencia aberta", "R$ 0", "Pronto para fechar", "muted"],
    ],
    currentSale: {
      title: "Venda atual",
      description: "Recibo #1842 - Marina Costa - Fidelidade VIP",
      status: "ABERTO",
      heads: ["Item", "Qtd", "Preco", "Total"],
      rows: [
        ["Vestido midi canelado - M / Preto", "1", "R$ 219", "R$ 219"],
        ["Sandalia tiras nude - 36", "1", "R$ 189", "R$ 189"],
        ["Cinto couro fino - Caramelo", "1", "R$ 89", "R$ 89"],
        ["Cupom aniversario", "-", "-R$ 40", "-R$ 40"],
      ],
    },
    paymentMethods: [
      ["Cartao de credito", "R$ 320", "secondary"],
      ["Pix", "R$ 137", "card"],
      ["Dinheiro", "R$ 0", "card"],
    ],
    receipt: {
      label: "Total do recibo",
      total: "R$ 457,00",
      actionLabel: "Concluir pagamento",
      rows: [
        ["Subtotal", "R$ 497,00"],
        ["Desconto", "-R$ 40,00"],
        ["Pago", "R$ 320,00"],
        ["Restante", "R$ 137,00"],
      ],
    },
    drawerCount: [
      ["Fundo inicial", "R$ 500"],
      ["Vendas em dinheiro", "R$ 380"],
      ["Sangrias", "-R$ 0"],
      ["Esperado", "R$ 880"],
    ],
    transactions: [
      ["#1841 - Cartao", "R$ 219"],
      ["#1840 - Pix", "R$ 148"],
      ["#1839 - Dinheiro", "R$ 92"],
    ],
    labels: {
      drawerCount: "Contagem da gaveta",
      recentTransactions: "Transacoes recentes",
    },
  },
  es: {
    ...cashRegisterContent,
    sidebar: { status: "Caja abierta - 04:18", operatorRole: "Turno de caja" },
    header: {
      title: "Caja",
      description:
        "Procesa ventas, concilia pagos, gestiona efectivo y cierra el turno actual.",
      searchPlaceholder: "Escanear codigo o recibo",
      actionLabel: "Cerrar turno",
    },
    metrics: [
      ["Ventas netas", "R$ 4.820", "46 recibos", "success"],
      ["Tarjeta capturada", "R$ 3.210", "Lote Stone 0047", "info"],
      ["Gaveta", "R$ 920", "R$ 40 sobre el fondo", "warning"],
      ["Diferencia abierta", "R$ 0", "Listo para cerrar", "muted"],
    ],
    currentSale: {
      title: "Venta actual",
      description: "Recibo #1842 - Marina Costa - Fidelidad VIP",
      status: "ABIERTO",
      heads: ["Item", "Cant", "Precio", "Total"],
      rows: [
        ["Vestido midi acanalado - M / Negro", "1", "R$ 219", "R$ 219"],
        ["Sandalia tiras nude - 36", "1", "R$ 189", "R$ 189"],
        ["Cinto cuero fino - Caramelo", "1", "R$ 89", "R$ 89"],
        ["Cupon cumpleanos", "-", "-R$ 40", "-R$ 40"],
      ],
    },
    paymentMethods: [
      ["Tarjeta de credito", "R$ 320", "secondary"],
      ["Pix", "R$ 137", "card"],
      ["Efectivo", "R$ 0", "card"],
    ],
    receipt: {
      label: "Total del recibo",
      total: "R$ 457,00",
      actionLabel: "Completar pago",
      rows: [
        ["Subtotal", "R$ 497,00"],
        ["Descuento", "-R$ 40,00"],
        ["Pagado", "R$ 320,00"],
        ["Restante", "R$ 137,00"],
      ],
    },
    drawerCount: [
      ["Fondo inicial", "R$ 500"],
      ["Ventas efectivo", "R$ 380"],
      ["Retiros", "-R$ 0"],
      ["Esperado", "R$ 880"],
    ],
    transactions: [
      ["#1841 - Tarjeta", "R$ 219"],
      ["#1840 - Pix", "R$ 148"],
      ["#1839 - Efectivo", "R$ 92"],
    ],
    labels: {
      drawerCount: "Conteo de gaveta",
      recentTransactions: "Transacciones recientes",
    },
  },
} as const;
