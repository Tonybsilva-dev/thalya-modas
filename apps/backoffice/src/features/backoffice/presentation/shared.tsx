"use client";
import { ErrorReference } from "@/src/shared/ui/error-reference";
import type { ReactNode } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { Alert, AlertTitle, AlertDescription, Badge, Button, Card, CardContent, PageHeader } from "@store-flow/ui";
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return <PageHeader title={title} description={description} primaryAction={action} />;
}
export function QueryState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: unknown;
  retry: () => void;
}) {
  if (loading)
    return (
      <Card role="status"><CardContent className="text-sm text-muted-foreground">
        Carregando dados da plataforma…
      </CardContent></Card>
    );
  if (error)
    return (
      <Alert variant="destructive">
        <WarningCircle aria-hidden="true" />
        <div>
        <AlertTitle>Não foi possível carregar os dados.</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Tente novamente."}
        </AlertDescription>
        <ErrorReference error={error} />
        <Button variant="outline" onClick={retry}>
          Tentar novamente
        </Button>
        </div>
      </Alert>
    );
  return null;
}
export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    ACTIVE: "Ativa",
    SUSPENDED: "Suspensa",
    INACTIVE: "Inativa",
    PENDING_VERIFICATION: "Verificação pendente",
    PENDING_ONBOARDING: "Em configuração",
  };
  return (
    <Badge variant={status === "ACTIVE" ? "success" : status === "INACTIVE" ? "secondary" : "warning"}>
      {labels[status] ?? status}
    </Badge>
  );
}
export function MutationError({ error }: { error: unknown }) {
  return error ? (
    <Alert variant="destructive"><WarningCircle aria-hidden="true" /><AlertDescription>
      {error instanceof Error
        ? error.message
        : "Não foi possível salvar. Tente novamente."}
    <ErrorReference error={error} /></AlertDescription></Alert>
  ) : null;
}
