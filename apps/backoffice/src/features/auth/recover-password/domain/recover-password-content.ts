export const recoverPasswordContent = {
  steps: [
    { key: "request", width: "w-[54px]" },
    { key: "code", width: "w-[54px]" },
    { key: "reset", width: "w-[54px]" },
    { key: "success", width: "w-[54px]" },
  ],
  shared: {
    brand: "Store Flow",
    backToCode: "Voltar para código",
    backToEmail: "Voltar para e-mail",
    backToLogin: "Voltar para login",
    bullets: [
      "Proteção para contas administrativas",
      "Código temporário por e-mail",
      "Redefinição guiada em poucos passos",
    ],
  },
  request: {
    heroTitle: "Recupere o acesso com segurança",
    heroDescription:
      "Um fluxo claro para restaurar o acesso sem interromper a operação da loja.",
    title: "Recuperar senha",
    description:
      "Informe o e-mail usado para acessar o dashboard da loja. Enviaremos um código temporário para continuar.",
    emailLabel: "E-mail",
    emailPlaceholder: "financeiro@loja.com",
    primaryAction: "Enviar código",
    secondaryAction: "Voltar para login",
  },
  code: {
    heroTitle: "Confirme sua identidade",
    heroDescription:
      "A verificação por código reduz o risco de acesso indevido ao painel administrativo.",
    title: "Verificar código",
    description:
      "Digite o código enviado para financeiro@loja.com. O código expira em 10 minutos.",
    code: ["4", "8", "1", "2", "", ""],
    primaryAction: "Confirmar código",
    secondaryAction: "Reenviar código em 32s",
  },
  reset: {
    heroTitle: "Defina uma nova credencial",
    heroDescription:
      "O sistema guia os requisitos mínimos antes de liberar o retorno ao dashboard.",
    title: "Criar nova senha",
    description:
      "Defina uma senha forte para proteger pedidos, estoque, caixa e relatórios da loja.",
    passwordLabel: "Nova senha",
    confirmPasswordLabel: "Confirmar senha",
    passwordPlaceholder: "••••••••••",
    hint: "Use pelo menos 8 caracteres com número e letra maiúscula.",
    primaryAction: "Atualizar senha",
  },
  success: {
    heroTitle: "Acesso restaurado",
    heroDescription:
      "Confirmação simples para fechar o fluxo e voltar para o sistema sem dúvida sobre o próximo passo.",
    title: "Senha atualizada",
    description:
      "A nova senha já está ativa. Você pode retornar ao dashboard e continuar a operação da loja.",
    primaryAction: "Entrar no dashboard",
    secondaryAction: "Voltar para login",
  },
} as const;

export type RecoverPasswordStep = keyof Pick<
  typeof recoverPasswordContent,
  "code" | "request" | "reset" | "success"
>;
