export const reportsContent = {
  sidebar: {
    status: "12 reports ready",
    operatorRole: "Manager on duty",
  },
  header: {
    title: "Reports",
    description: "Crie, agende e exporte relatórios operacionais em poucos passos.",
    actions: ["Schedule", "Export", "New report"],
  },
  controls: ["May 2026", "Centro 01", "PDF + CSV"],
  searchPlaceholder: "Buscar relatório ou métrica...",
  metrics: [
    ["84", "Generated", "This month"],
    ["7", "Pending", "Exports"],
    ["23", "Scheduled", "Automations"],
  ],
  catalog: [
    ["Sales & revenue", "Vendas, margem e ticket médio", true],
    ["Inventory movement", "Entradas, saídas e rupturas", false],
    ["Cash register close", "Fechamento, sangrias e divergências", false],
    ["Customers & loyalty", "Clientes, promissórias e recorrência", false],
    ["Suppliers", "Compras, prazos e performance", false],
  ],
  preview: {
    title: "Sales & revenue",
    description: "Preview · May 1-26 · Centro 01",
    status: "Ready to generate",
    chartTitle: "Revenue by week",
    weeks: [
      ["W1", 58],
      ["W2", 82],
      ["W3", 68],
      ["W4", 96],
      ["W5", 74],
    ],
    table: [
      ["Gross sales", "R$ 84.220", "+9.4%"],
      ["Net margin", "38.2%", "+2.5 pts"],
      ["Refunds", "R$ 1.140", "-39.3%"],
    ],
    options: [
      ["Sections", "Summary, charts, table"],
      ["Delivery", "PDF every Monday"],
      ["Source", "POS, inventory, cash"],
    ],
  },
  scheduled: [
    "Daily sales · 7:30",
    "Cash close · Friday",
  ],
  exports: [
    "Sales May · PDF",
    "Promissórias · CSV",
  ],
} as const;

export const reportsContentByLocale = {
  "pt-BR": {
    ...reportsContent,
    sidebar: {
      status: "12 relatorios prontos",
      operatorRole: "Gerente em turno",
    },
    header: {
      title: "Relatorios",
      description: "Crie, agende e exporte relatorios operacionais em poucos passos.",
      actions: ["Agendar", "Exportar", "Novo relatorio"],
    },
    controls: ["Maio 2026", "Centro 01", "PDF + CSV"],
    searchPlaceholder: "Buscar relatorio ou metrica...",
    metrics: [
      ["84", "Gerados", "Este mes"],
      ["7", "Pendentes", "Exportacoes"],
      ["23", "Agendados", "Automacoes"],
    ],
    catalog: [
      ["Vendas e receita", "Vendas, margem e ticket medio", true],
      ["Movimento de estoque", "Entradas, saidas e rupturas", false],
      ["Fechamento de caixa", "Fechamento, sangrias e divergencias", false],
      ["Clientes e fidelidade", "Clientes, promissorias e recorrencia", false],
      ["Fornecedores", "Compras, prazos e performance", false],
    ],
    preview: {
      ...reportsContent.preview,
      title: "Vendas e receita",
      description: "Preview - 1 a 26 de maio - Centro 01",
      status: "Pronto para gerar",
      chartTitle: "Receita por semana",
      table: [
        ["Vendas brutas", "R$ 84.220", "+9,4%"],
        ["Margem liquida", "38,2%", "+2,5 pts"],
        ["Estornos", "R$ 1.140", "-39,3%"],
      ],
      options: [
        ["Secoes", "Resumo, graficos, tabela"],
        ["Entrega", "PDF toda segunda"],
        ["Fonte", "POS, estoque, caixa"],
      ],
    },
    scheduled: ["Vendas diarias - 7:30", "Fechamento de caixa - sexta"],
    exports: ["Vendas Maio - PDF", "Promissorias - CSV"],
    labels: {
      filters: "Filtros",
      recentExports: "Exportacoes recentes",
      scheduled: "Agendados",
      templates: "Templates",
    },
  },
  en: {
    ...reportsContent,
    header: {
      title: "Reports",
      description: "Create, schedule and export operational reports in a few steps.",
      actions: ["Schedule", "Export", "New report"],
    },
    searchPlaceholder: "Search report or metric...",
    labels: {
      filters: "Filters",
      recentExports: "Recent exports",
      scheduled: "Scheduled",
      templates: "Templates",
    },
  },
  es: {
    ...reportsContent,
    sidebar: {
      status: "12 reportes listos",
      operatorRole: "Gerente de turno",
    },
    header: {
      title: "Reportes",
      description: "Crea, agenda y exporta reportes operacionales en pocos pasos.",
      actions: ["Agendar", "Exportar", "Nuevo reporte"],
    },
    controls: ["Mayo 2026", "Centro 01", "PDF + CSV"],
    searchPlaceholder: "Buscar reporte o metrica...",
    metrics: [
      ["84", "Generados", "Este mes"],
      ["7", "Pendientes", "Exportaciones"],
      ["23", "Agendados", "Automaciones"],
    ],
    catalog: [
      ["Ventas e ingresos", "Ventas, margen y ticket medio", true],
      ["Movimiento de inventario", "Entradas, salidas y rupturas", false],
      ["Cierre de caja", "Cierre, retiros y divergencias", false],
      ["Clientes y fidelidad", "Clientes, promesas y recurrencia", false],
      ["Proveedores", "Compras, plazos y performance", false],
    ],
    preview: {
      ...reportsContent.preview,
      title: "Ventas e ingresos",
      description: "Preview - 1 a 26 de mayo - Centro 01",
      status: "Listo para generar",
      chartTitle: "Ingresos por semana",
      table: [
        ["Ventas brutas", "R$ 84.220", "+9,4%"],
        ["Margen neto", "38,2%", "+2,5 pts"],
        ["Devoluciones", "R$ 1.140", "-39,3%"],
      ],
      options: [
        ["Secciones", "Resumen, graficos, tabla"],
        ["Entrega", "PDF cada lunes"],
        ["Fuente", "POS, inventario, caja"],
      ],
    },
    scheduled: ["Ventas diarias - 7:30", "Cierre de caja - viernes"],
    exports: ["Ventas Mayo - PDF", "Promesas - CSV"],
    labels: {
      filters: "Filtros",
      recentExports: "Exportaciones recientes",
      scheduled: "Agendados",
      templates: "Templates",
    },
  },
} as const;
