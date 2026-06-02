export type OnboardingStep = "profile" | "address" | "preferences" | "completed";

export const onboardingStepOrder: OnboardingStep[] = [
  "profile",
  "address",
  "preferences",
  "completed",
];

export const onboardingRoutes = {
  profile: "/onboarding",
  address: "/onboarding/address",
  preferences: "/onboarding/preferences",
  completed: "/onboarding/completed",
  dashboard: "/manager/dashboard",
} as const;

export const onboardingContent = {
  profile: {
    title: "Perfil da loja",
    description: "Informe os dados principais da loja.",
    action: "Salvar e continuar",
    fields: {
      storeName: "Nome da loja",
      phone: "Telefone",
      document: "CPF ou CNPJ",
      segment: "Segmento",
    },
  },
  address: {
    title: "Endereco da loja",
    description: "Adicione o endereco comercial.",
    action: "Salvar endereco",
    fields: {
      zipCode: "CEP",
      number: "Numero",
      street: "Rua",
      neighborhood: "Bairro",
      complement: "Complemento",
      city: "Cidade",
      state: "UF",
    },
    lookupIdle: "Digite o CEP completo para preencher o endereco.",
    lookupLoading: "Buscando endereco pelo CEP.",
    lookupNotFound: "CEP nao encontrado. Preencha o endereco manualmente.",
  },
  preferences: {
    title: "Preferencias da operacao",
    description: "Defina as preferencias basicas da operacao.",
    action: "Finalizar preferencias",
    helper: "O horario de abertura precisa ser anterior ao fechamento.",
    fields: {
      currency: "Moeda",
      language: "Idioma",
      timezone: "Fuso horario",
      openingTime: "Abertura",
      closingTime: "Fechamento",
    },
  },
  completed: {
    title: "Onboarding concluido",
    description: "Tudo pronto para comecar.",
    successTitle: "Configuracao concluida",
    successDescription: "Sua loja esta pronta para uso.",
    primaryAction: "Entrar no dashboard",
    secondaryAction: "Revisar dados",
  },
} as const;

export const storeSegments = [
  { label: "Fashion", value: "fashion" },
  { label: "Accessories", value: "accessories" },
  { label: "Footwear", value: "footwear" },
  { label: "Mixed", value: "mixed" },
] as const;

export const storeCurrencies = [{ label: "BRL", value: "BRL" }] as const;

export const storeLanguages = [
  { label: "Portugues (Brasil)", value: "pt-BR" },
  { label: "English", value: "en" },
  { label: "Espanol", value: "es" },
] as const;

export const storeTimezones = [
  { label: "America/Fortaleza", value: "America/Fortaleza" },
  { label: "America/Sao Paulo", value: "America/Sao_Paulo" },
] as const;
