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
