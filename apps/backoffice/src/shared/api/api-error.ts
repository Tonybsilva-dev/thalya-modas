export type ApiErrorLevel = "info" | "warning" | "error" | "critical";

export type ApiErrorCategory =
  | "auth"
  | "domain"
  | "feature"
  | "forbidden"
  | "internal"
  | "not-found"
  | "validation";

export type ApiErrorCode =
  | "TM-AUTH-401"
  | "TM-VAL-400"
  | "TM-DOM-400"
  | "TM-AUTHZ-403"
  | "TM-FEAT-403"
  | "TM-RES-404"
  | "TM-SYS-500";

export type ApiProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: ApiErrorCode | string;
  acronym?: string;
  level?: ApiErrorLevel;
  category?: ApiErrorCategory;
  error?: string;
  message?: string;
  details?: unknown;
  traceId?: string;
  userMessage?: string;
};

export type NormalizedApiError = ApiProblemDetails & {
  status: number;
  userMessage: string;
  title: string;
  level: ApiErrorLevel;
};

const fallbackMessages: Record<string, string> = {
  "TM-AUTH-401": "Entre novamente para continuar.",
  "TM-VAL-400": "Revise os campos destacados e tente novamente.",
  "TM-DOM-400": "Revise as informacoes e tente novamente.",
  "TM-AUTHZ-403": "Voce nao tem permissao para executar esta acao.",
  "TM-FEAT-403": "Funcionalidade temporariamente indisponivel.",
  "TM-RES-404": "Nao encontramos o recurso solicitado.",
  "TM-SYS-500": "Nao foi possivel concluir agora. Tente novamente em instantes.",
};

export function normalizeApiErrorPayload(
  status: number,
  payload: unknown,
): NormalizedApiError {
  if (!payload || typeof payload !== "object") {
    return fallbackError(status);
  }

  const problem = payload as ApiProblemDetails;
  const codeMessage = problem.code ? fallbackMessages[problem.code] : undefined;
  const userMessage =
    problem.userMessage ?? problem.message ?? problem.detail ?? codeMessage ?? fallbackError(status).userMessage;

  return {
    ...problem,
    status: problem.status ?? status,
    title: problem.title ?? fallbackTitle(status),
    level: problem.level ?? (status >= 500 ? "error" : "warning"),
    userMessage,
  };
}

function fallbackError(status: number): NormalizedApiError {
  return {
    status,
    title: fallbackTitle(status),
    level: status >= 500 ? "error" : "warning",
    userMessage:
      status >= 500
        ? "Nao foi possivel concluir agora. Tente novamente em instantes."
        : "Nao foi possivel concluir a solicitacao.",
  };
}

function fallbackTitle(status: number): string {
  if (status === 401) return "Autenticacao necessaria";
  if (status === 403) return "Acesso negado";
  if (status === 404) return "Recurso nao encontrado";
  if (status >= 500) return "Erro interno";
  return "Erro na solicitacao";
}
