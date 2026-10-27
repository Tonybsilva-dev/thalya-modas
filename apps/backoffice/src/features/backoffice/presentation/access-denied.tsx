"use client";
import { WarningCircle } from "@phosphor-icons/react";
import { Alert, AlertDescription, Button, Card } from "@store-flow/ui";
import { useState } from "react";
import { logout } from "@/src/features/auth/logout/application/logout-api";
import { clearLastStoreCookie } from "@/src/shared/store/last-store-cookie";
export function AccessDenied() {
  const [error, setError] = useState("");
  return (
    <main className="grid min-h-dvh place-items-center bg-background p-6">
      <Card className="max-w-md space-y-5 p-8">
        <p className="text-sm font-semibold text-primary">
          Store Flow · Backoffice
        </p>
        <h1 className="text-2xl font-semibold">
          Acesso exclusivo do SUPER_ADMIN
        </h1>
        <p className="text-sm text-muted-foreground">
          Esta conta não tem acesso à administração da plataforma. O ambiente
          para administradores de empresas, funcionários e clientes será
          disponibilizado em outro app.
        </p>
        {error && (
          <Alert variant="destructive"><WarningCircle aria-hidden="true" /><AlertDescription>
            {error}
          </AlertDescription></Alert>
        )}
        <Button
          onClick={async () => {
            try {
              await logout();
              clearLastStoreCookie();
              window.location.assign("/auth/login");
            } catch {
              setError("Não foi possível encerrar a sessão. Tente novamente.");
            }
          }}
        >
          Entrar com outra conta
        </Button>
      </Card>
    </main>
  );
}
