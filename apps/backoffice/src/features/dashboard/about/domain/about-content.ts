export const aboutContent = {
  sidebar: {
    status: "Open until 19:00",
    operatorRole: "Manager on duty",
  },
  header: {
    title: "Sobre",
    description:
      "Informações sobre a agência responsável, manutenção e histórico do sistema.",
    actionLabel: "Contato técnico",
  },
  agency: {
    initials: "AG",
    name: "Agência de Desenvolvimento",
    description:
      "Parceiro técnico responsável pelo desenvolvimento e evolução do Store Flow.",
    summary:
      "Esta página centraliza informações institucionais e técnicas para consulta pela equipe da loja, suporte e gestão.",
    badges: ["Sistema em evolução", "Suporte ativo"],
  },
  facts: [
    ["Produto", "Store Flow"],
    ["Versão", "1.0.0"],
    ["Última atualização", "26 mai 2026"],
    ["Canal", "Configurações > Sobre"],
  ],
  scope: [
    [
      "Gestão de loja",
      "Dashboard, caixa, estoque, clientes, fornecedores e pedidos.",
    ],
    [
      "Relatórios",
      "Rotas para relatórios operacionais, vendas, estoque e financeiro.",
    ],
    [
      "Experiência global",
      "Estados de loading, erro, Empty State e componentes de feedback.",
    ],
    ["Design system", "Componentes reutilizáveis documentáveis no Storybook."],
  ],
  support: [
    ["Suporte técnico", "suporte@agencia.dev", "mail"],
    ["Comercial", "contato@agencia.dev", "briefcase"],
    ["Atendimento", "Segunda a sexta, 9h às 18h", "calendar"],
    ["SLA inicial", "Retorno em até 1 dia útil", "shield"],
  ],
  footer: {
    note: "Acessível pelo rodapé da aplicação ou pelo dashboard em Configurações > Sobre.",
    copyright: "© 2026 Store Flow",
  },
} as const;

export const aboutContentByLocale = {
  "pt-BR": aboutContent,
  en: {
    ...aboutContent,
    sidebar: {
      status: "Open until 19:00",
      operatorRole: "Manager on duty",
    },
    header: {
      title: "About",
      description:
        "Information about the responsible agency, maintenance and system history.",
      actionLabel: "Technical contact",
    },
    agency: {
      ...aboutContent.agency,
      name: "Development Agency",
      description:
        "Technical partner responsible for Store Flow development and evolution.",
      summary:
        "This page centralizes institutional and technical information for store staff, support and management.",
      badges: ["System evolving", "Active support"],
    },
    facts: [
      ["Product", "Store Flow"],
      ["Version", "1.0.0"],
      ["Last update", "May 26, 2026"],
      ["Channel", "Settings > About"],
    ],
    scope: [
      ["Store management", "Dashboard, register, inventory, customers, suppliers and orders."],
      ["Reports", "Routes for operational, sales, inventory and financial reports."],
      ["Global experience", "Loading, error, Empty State and feedback components."],
      ["Design system", "Reusable components documented in Storybook."],
    ],
    support: [
      ["Technical support", "suporte@agencia.dev", "mail"],
      ["Commercial", "contato@agencia.dev", "briefcase"],
      ["Service hours", "Monday to Friday, 9am to 6pm", "calendar"],
      ["Initial SLA", "Response within 1 business day", "shield"],
    ],
    footer: {
      note: "Accessible from the app footer or from Dashboard in Settings > About.",
      copyright: "© 2026 Store Flow",
    },
    labels: {
      scope: "System scope",
      support: "Contact and maintenance",
    },
  },
  es: {
    ...aboutContent,
    sidebar: {
      status: "Abierta hasta 19:00",
      operatorRole: "Gerente de turno",
    },
    header: {
      title: "Acerca de",
      description:
        "Informacion sobre la agencia responsable, mantenimiento e historial del sistema.",
      actionLabel: "Contacto tecnico",
    },
    agency: {
      ...aboutContent.agency,
      name: "Agencia de Desarrollo",
      description:
        "Socio tecnico responsable por el desarrollo y evolucion de Store Flow.",
      summary:
        "Esta pagina centraliza informacion institucional y tecnica para el equipo de tienda, soporte y gestion.",
      badges: ["Sistema en evolucion", "Soporte activo"],
    },
    facts: [
      ["Producto", "Store Flow"],
      ["Version", "1.0.0"],
      ["Ultima actualizacion", "26 may 2026"],
      ["Canal", "Configuracion > Acerca de"],
    ],
    scope: [
      ["Gestion de tienda", "Dashboard, caja, inventario, clientes, proveedores y pedidos."],
      ["Reportes", "Rutas para reportes operacionales, ventas, inventario y finanzas."],
      ["Experiencia global", "Estados de carga, error, Empty State y feedback."],
      ["Design system", "Componentes reutilizables documentados en Storybook."],
    ],
    support: [
      ["Soporte tecnico", "suporte@agencia.dev", "mail"],
      ["Comercial", "contato@agencia.dev", "briefcase"],
      ["Atencion", "Lunes a viernes, 9h a 18h", "calendar"],
      ["SLA inicial", "Respuesta en hasta 1 dia habil", "shield"],
    ],
    footer: {
      note: "Accesible desde el pie de la aplicacion o desde Dashboard en Configuracion > Acerca de.",
      copyright: "© 2026 Store Flow",
    },
    labels: {
      scope: "Alcance del sistema",
      support: "Contacto y mantenimiento",
    },
  },
} as const;
