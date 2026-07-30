export const suppliersContent = {
  sidebar: {
    status: "Supplier management",
    operatorRole: "Supply desk",
  },
  header: {
    title: "Suppliers",
    description:
      "Manage supplier records, contacts, purchase terms, orders, and receiving priorities.",
    searchPlaceholder: "Search name, document, email or phone",
    actionLabel: "New supplier",
  },
} as const;

export const suppliersContentByLocale = {
  en: suppliersContent,
  "pt-BR": {
    sidebar: {
      status: "Gestão de fornecedores",
      operatorRole: "Mesa de compras",
    },
    header: {
      title: "Fornecedores",
      description:
        "Gerencie cadastros, contatos, condições de compra, pedidos e prioridades de recebimento.",
      searchPlaceholder: "Buscar nome, documento, e-mail ou telefone",
      actionLabel: "Novo fornecedor",
    },
  },
  es: {
    sidebar: {
      status: "Gestión de proveedores",
      operatorRole: "Mesa de compras",
    },
    header: {
      title: "Proveedores",
      description:
        "Gestiona registros, contactos, condiciones de compra, órdenes y prioridades de recepción.",
      searchPlaceholder: "Buscar nombre, documento, e-mail o teléfono",
      actionLabel: "Nuevo proveedor",
    },
  },
} as const;
