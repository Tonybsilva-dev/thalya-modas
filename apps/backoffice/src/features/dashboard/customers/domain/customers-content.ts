export const customersContent = {
  sidebar: {
    status: "2,418 customers synced",
    detailStatus: "Customer profile open",
    promissoryStatus: "Promissória em análise",
    operatorRole: "Customer desk",
  },
  header: {
    title: "Customers",
    description: "Track loyalty, purchase history, birthdays, returns, and high-intent outreach.",
    searchPlaceholder: "Search name, phone, CPF",
    campaignLabel: "Campaign",
    actionLabel: "Add customer",
  },
  metrics: [
    ["Active customers", "1,284", "Bought in last 90 days", "info"],
    ["Loyalty members", "842", "R$ 38.2k points balance", "success"],
    ["Birthdays this week", "19", "7 high-value contacts", "warning"],
    ["Repeat rate", "41%", "+5 pts vs last month", "muted"],
  ],
  filters: [
    ["all", "All customers"],
    ["vip", "VIP"],
    ["birthday", "Birthday"],
    ["at-risk", "At risk"],
    ["returns", "Returns"],
    ["whatsapp", "WhatsApp opt-in"],
  ],
  table: {
    title: "Customer list",
    description: "Prioritize buyers by lifetime value, loyalty status, and next best action.",
    segmentLabel: "Segment",
    rows: [
      ["Marina Costa", "85 99142-7712", "Today", "R$ 4.8k", "VIP", "Reserve dress"],
      ["Beatriz Lima", "85 98801-3370", "2 days", "R$ 2.1k", "Loyalty", "Send lookbook"],
      ["Camila Rocha", "85 99718-1102", "8 days", "R$ 980", "Birthday", "Gift coupon"],
      ["Juliana Alves", "85 98944-2210", "16 days", "R$ 1.6k", "At risk", "WhatsApp"],
      ["Rafaela Nunes", "85 99200-8139", "21 days", "R$ 760", "Returns", "Fit note"],
      ["Larissa Melo", "85 98763-9042", "31 days", "R$ 3.4k", "VIP", "New arrival"],
      ["Fernanda Dias", "85 99620-4551", "45 days", "R$ 540", "Inactive", "Winback"],
      ["Patricia Souza", "85 99418-7006", "58 days", "R$ 1.1k", "Loyalty", "Points alert"],
    ],
  },
  bulkActions: {
    selected: "0 selected",
    hint: "Select customers to send messages, assign tags, or export a segment.",
  },
  rail: {
    initials: "MC",
    name: "Marina Costa",
    description: "VIP • WhatsApp opt-in",
    stats: [
      ["Lifetime", "R$ 4.8k"],
      ["Orders", "23"],
      ["Avg ticket", "R$ 209"],
    ],
    loyalty:
      "R$ 182 in points available. Next tier unlocks after R$ 420 in purchases.",
    actions: ["Reserve black midi dress", "Send birthday coupon", "Follow up on alteration"],
    purchases: [
      ["Vestido midi canelado", "Today • R$ 219"],
      ["Sandália tiras nude", "May 18 • R$ 189"],
      ["Calça alfaiataria", "May 02 • R$ 249"],
    ],
  },
  detail: {
    breadcrumb: "Customers / Mariana Costa",
    name: "Mariana Costa",
    description: "VIP customer • Last purchase 2 days ago • WhatsApp opt-in",
    email: "mariana.costa@email.com • +55 85 98842-7810",
    actions: ["Message", "Edit profile", "New order"],
    tags: ["VIP", "WhatsApp", "No debt"],
    stats: [
      ["Total spent", "R$ 8.420"],
      ["Orders", "37"],
      ["Avg. ticket", "R$ 227"],
      ["Loyalty points", "3.240"],
    ],
    tabs: ["Overview", "Orders", "Notes", "Preferences"],
    recentOrders: [
      ["#1048", "2 days ago", "R$ 420", "Paid"],
      ["#1032", "12 days ago", "R$ 189", "Picked up"],
      ["#1017", "Apr 30", "R$ 760", "Returned item"],
      ["#0991", "Apr 18", "R$ 238", "Paid"],
    ],
    notes: [
      "Prefers linen dresses in neutral colors.",
      "Usually buys near payday and responds on WhatsApp.",
      "Birthday: August 18. Offer early VIP preview.",
    ],
    loyaltyTier: {
      title: "Gold member",
      description: "R$ 580 until Platinum tier",
    },
    nextActions: ["Send birthday preview", "Offer linen dress restock", "Invite to VIP sale"],
    timeline: [
      ["Bought linen set", "2 days ago"],
      ["Redeemed loyalty credit", "12 days ago"],
      ["Opened WhatsApp campaign", "18 days ago"],
      ["Returned blouse for size change", "Apr 30"],
    ],
  },
  promissory: {
    breadcrumb: "Customers / Mariana Costa / Promissória",
    title: "Promissória de Mariana Costa",
    description:
      "Acompanhe parcelas, atrasos, pagamentos recentes, acordos e histórico de compras a prazo.",
    actions: ["Registrar pagamento", "Renegociar", "Exportar"],
    alertTitle: "Pagamento em atraso há 12 dias",
    alertDescription:
      "A parcela vencida em 14 de maio de 2026 ainda não foi baixada. Próxima ação recomendada: contato por WhatsApp hoje.",
    metrics: [
      ["Valor em aberto", "R$ 1.248,00", "3 parcelas pendentes"],
      ["Em atraso", "R$ 416,00", "12 dias vencidos"],
      ["Último pagamento", "02 maio 2026", "R$ 416 via Pix"],
      ["Limite a prazo", "R$ 2.000,00", "62% utilizado"],
    ],
    installments: [
      ["14 maio 2026", "Vence em 12 dias", "R$ 416,00", "Atrasada"],
      ["14 junho 2026", "Vence em 19 dias", "R$ 416,00", "Em aberto"],
      ["14 julho 2026", "Vence em 49 dias", "R$ 416,00", "Em aberto"],
    ],
    purchases: [
      ["#1048 • Vestido linho + sandália", "02 maio 2026", "R$ 1.248,00"],
      ["#0991 • Blusa alfaiataria", "18 abr 2026", "R$ 238,00"],
    ],
    timeline: [
      ["Pagamento recebido", "02 maio • R$ 416 via Pix"],
      ["Compra parcelada criada", "02 maio • 3x de R$ 416"],
      ["Lembrete enviado", "15 maio • WhatsApp entregue"],
      ["Parcela atrasada", "26 maio • 12 dias vencidos"],
    ],
    risk: {
      label: "Risco de cobrança",
      value: "Médio",
      description: "Cliente historicamente paga após o primeiro lembrete.",
    },
  },
} as const;
