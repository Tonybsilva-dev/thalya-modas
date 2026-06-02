export const settingsContent = {
  sidebar: {
    status: "Settings synced",
    operatorRole: "Admin",
  },
  header: {
    title: "Settings",
    description:
      "Configure store operations, permissions, payments, notifications and local workflow preferences.",
    actionLabel: "Save changes",
  },
  tabs: [
    ["general", "General", ""],
    ["store", "Store", "store"],
    ["payments", "Payments", "payments"],
    ["team-security", "Team & Security", "team-security"],
    ["notifications", "Notifications", "notifications"],
  ],
  handoff:
    "This frame is a separate route/state for implementation handoff. Use the tabs as navigation and preserve URL-level state per option.",
  health: [
    ["Required fields", "Complete"],
    ["Last saved", "2 min ago"],
    ["Audit status", "Tracked"],
  ],
  sections: {
    general: {
      title: "General",
      description: "Separated design state for the active settings tab.",
      rows: [
        ["Language and region", "Default locale, date format and currency for the store.", "Edit"],
        ["Low stock threshold", "Global warning level used by inventory and order workflows.", "Edit"],
        ["Auto-save dashboard filters", "Keep each operator's table filters between sessions.", ""],
        ["Daily opening checklist", "Require shift checklist before register opening.", ""],
      ],
    },
    store: {
      title: "Store",
      description: "Separated design state for the active settings tab.",
      rows: [
        ["Store profile", "Business name, tax ID, public contact and address.", "Edit"],
        ["Opening hours", "Weekly schedule and holiday exceptions.", "Edit"],
        ["Pickup instructions", "Customer-facing instructions for online order pickup.", "Edit"],
        ["Receipt footer message", "Custom text printed on receipts and invoices.", "Edit"],
      ],
    },
    payments: {
      title: "Payments",
      description: "Separated design state for the active settings tab.",
      rows: [
        ["Payment providers", "Stone, Pix and manual cash settlement configuration.", "Manage"],
        ["Card batch reconciliation", "Auto-match terminal batches against register close.", ""],
        ["Refund approval", "Require manager PIN for refunds above R$ 150.", ""],
        ["Installment rules", "Allowed installment count and minimum order value.", "Edit"],
      ],
    },
    "team-security": {
      title: "Team & Security",
      description: "Separated design state for the active settings tab.",
      rows: [
        ["Team members", "Invite operators, managers and inventory leads.", "Manage"],
        ["Roles and permissions", "Control access to cash close, refunds and supplier data.", "Edit"],
        ["Two-factor authentication", "Require second factor for admin accounts.", ""],
        ["Session timeout", "Automatically lock inactive registers and dashboards.", "Edit"],
      ],
    },
    notifications: {
      title: "Notifications",
      description: "Separated design state for the active settings tab.",
      rows: [
        ["WhatsApp updates", "Customer pickup and order-ready messaging.", ""],
        ["Low stock alerts", "Notify inventory lead when critical SKUs drop below threshold.", ""],
        ["Cash variance alerts", "Send manager alert when register variance is detected.", ""],
        ["Daily summary email", "End-of-day sales, stock and cash report recipients.", "Edit"],
      ],
    },
  },
} as const;

export const settingsContentByLocale = {
  en: settingsContent,
  "pt-BR": {
    ...settingsContent,
    sidebar: {
      status: "Configuracoes sincronizadas",
      operatorRole: "Admin",
    },
    header: {
      title: "Configuracoes",
      description:
        "Configure operacao da loja, permissoes, pagamentos, notificacoes e preferencias locais.",
      actionLabel: "Salvar alteracoes",
    },
    tabs: [
      ["general", "Geral", ""],
      ["store", "Loja", "store"],
      ["payments", "Pagamentos", "payments"],
      ["team-security", "Equipe e seguranca", "team-security"],
      ["notifications", "Notificacoes", "notifications"],
    ],
    handoff:
      "Esta area preserva o estado por rota. Use as abas como navegacao e mantenha contexto local por opcao.",
    health: [
      ["Campos obrigatorios", "Completo"],
      ["Ultimo salvamento", "2 min atras"],
      ["Auditoria", "Rastreada"],
    ],
    sections: {
      general: {
        title: "Geral",
        description: "Estado separado para a aba ativa de configuracoes.",
        rows: [
          ["Idioma e regiao", "Locale, formato de data e moeda padrao da loja.", "Editar"],
          ["Limite de baixo estoque", "Nivel global de alerta usado por estoque e pedidos.", "Editar"],
          ["Salvar filtros do dashboard", "Mantem filtros de tabelas por operador entre sessoes.", ""],
          ["Checklist diario de abertura", "Exige checklist antes da abertura do caixa.", ""],
        ],
      },
      store: {
        title: "Loja",
        description: "Estado separado para a aba ativa de configuracoes.",
        rows: [
          ["Perfil da loja", "Razao social, documento, contato publico e endereco.", "Editar"],
          ["Horarios de funcionamento", "Agenda semanal e excecoes de feriados.", "Editar"],
          ["Instrucoes de retirada", "Instrucoes para clientes retirarem pedidos online.", "Editar"],
          ["Mensagem do cupom", "Texto personalizado impresso em recibos e notas.", "Editar"],
        ],
      },
      payments: {
        title: "Pagamentos",
        description: "Estado separado para a aba ativa de configuracoes.",
        rows: [
          ["Provedores de pagamento", "Configuracao de Stone, Pix e caixa manual.", "Gerenciar"],
          ["Conciliacao de lotes", "Associa lotes do terminal ao fechamento do caixa.", ""],
          ["Aprovacao de estorno", "Exige PIN do gerente para estornos acima de R$ 150.", ""],
          ["Regras de parcelamento", "Quantidade permitida e valor minimo do pedido.", "Editar"],
        ],
      },
      "team-security": {
        title: "Equipe e seguranca",
        description: "Estado separado para a aba ativa de configuracoes.",
        rows: [
          ["Membros da equipe", "Convide operadores, gerentes e lideres de estoque.", "Gerenciar"],
          ["Perfis e permissoes", "Controle acesso a caixa, estornos e fornecedores.", "Editar"],
          ["Autenticacao de dois fatores", "Exige segundo fator para contas admin.", ""],
          ["Timeout de sessao", "Bloqueia caixas e dashboards inativos automaticamente.", "Editar"],
        ],
      },
      notifications: {
        title: "Notificacoes",
        description: "Estado separado para a aba ativa de configuracoes.",
        rows: [
          ["Atualizacoes por WhatsApp", "Mensagens de pedido pronto e retirada.", ""],
          ["Alertas de baixo estoque", "Notifica o lider quando SKUs atingem nivel critico.", ""],
          ["Alertas de divergencia de caixa", "Avisa o gerente quando houver variacao.", ""],
          ["Resumo diario por e-mail", "Destinatarios do resumo de vendas, estoque e caixa.", "Editar"],
        ],
      },
    },
    labels: {
      currentTab: "Aba atual",
      configurationHealth: "Saude da configuracao",
      routeState: "Estado da rota",
      routeStateDescription:
        "As abas de configuracoes sao estados separados de rota, preservando contexto por secao.",
    },
  },
  es: {
    ...settingsContent,
    sidebar: {
      status: "Configuracion sincronizada",
      operatorRole: "Admin",
    },
    header: {
      title: "Configuracion",
      description:
        "Configura operacion de tienda, permisos, pagos, notificaciones y preferencias locales.",
      actionLabel: "Guardar cambios",
    },
    tabs: [
      ["general", "General", ""],
      ["store", "Tienda", "store"],
      ["payments", "Pagos", "payments"],
      ["team-security", "Equipo y seguridad", "team-security"],
      ["notifications", "Notificaciones", "notifications"],
    ],
    handoff:
      "Esta area preserva el estado por ruta. Usa las pestanas como navegacion y mantiene contexto local.",
    health: [
      ["Campos obligatorios", "Completo"],
      ["Ultimo guardado", "Hace 2 min"],
      ["Auditoria", "Rastreada"],
    ],
    sections: {
      general: {
        title: "General",
        description: "Estado separado para la pestana activa de configuracion.",
        rows: [
          ["Idioma y region", "Locale, formato de fecha y moneda predeterminada.", "Editar"],
          ["Limite de bajo stock", "Nivel global de alerta usado por inventario y pedidos.", "Editar"],
          ["Guardar filtros del dashboard", "Mantiene filtros por operador entre sesiones.", ""],
          ["Checklist diario de apertura", "Exige checklist antes de abrir la caja.", ""],
        ],
      },
      store: {
        title: "Tienda",
        description: "Estado separado para la pestana activa de configuracion.",
        rows: [
          ["Perfil de tienda", "Razon social, documento, contacto publico y direccion.", "Editar"],
          ["Horarios de apertura", "Agenda semanal y excepciones de feriados.", "Editar"],
          ["Instrucciones de retiro", "Instrucciones para clientes de pedidos online.", "Editar"],
          ["Mensaje del recibo", "Texto personalizado impreso en recibos y facturas.", "Editar"],
        ],
      },
      payments: {
        title: "Pagos",
        description: "Estado separado para la pestana activa de configuracion.",
        rows: [
          ["Proveedores de pago", "Configuracion de Stone, Pix y caja manual.", "Gestionar"],
          ["Conciliacion de lotes", "Asocia lotes del terminal al cierre de caja.", ""],
          ["Aprobacion de devolucion", "Exige PIN del gerente para devoluciones sobre R$ 150.", ""],
          ["Reglas de cuotas", "Cantidad permitida y valor minimo del pedido.", "Editar"],
        ],
      },
      "team-security": {
        title: "Equipo y seguridad",
        description: "Estado separado para la pestana activa de configuracion.",
        rows: [
          ["Miembros del equipo", "Invita operadores, gerentes y lideres de inventario.", "Gestionar"],
          ["Roles y permisos", "Controla acceso a caja, devoluciones y proveedores.", "Editar"],
          ["Autenticacion de dos factores", "Exige segundo factor para cuentas admin.", ""],
          ["Timeout de sesion", "Bloquea cajas y dashboards inactivos automaticamente.", "Editar"],
        ],
      },
      notifications: {
        title: "Notificaciones",
        description: "Estado separado para la pestana activa de configuracion.",
        rows: [
          ["Actualizaciones por WhatsApp", "Mensajes de pedido listo y retiro.", ""],
          ["Alertas de bajo stock", "Notifica al lider cuando SKUs alcanzan nivel critico.", ""],
          ["Alertas de diferencia de caja", "Avisa al gerente cuando hay variacion.", ""],
          ["Resumen diario por email", "Destinatarios del resumen de ventas, stock y caja.", "Editar"],
        ],
      },
    },
    labels: {
      currentTab: "Pestana actual",
      configurationHealth: "Salud de configuracion",
      routeState: "Estado de ruta",
      routeStateDescription:
        "Las pestanas de configuracion son estados de ruta separados, preservando contexto por seccion.",
    },
  },
} as const;

export type SettingsSection = keyof typeof settingsContent.sections;
