"use client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, Card } from "@store-flow/ui";
import { PlatformControls } from "./platform-controls";
import type { CurrentUser } from "@/src/features/auth/session/application/current-user-api";
import { useAppUiStore } from "@/src/shared/state/app-ui-store";
import { PageHeading } from "./shared";
export function SettingsPage({ user }: { user: CurrentUser }) {
  const themeMode = useAppUiStore((state) => state.themeMode);
  const setThemeMode = useAppUiStore((state) => state.setThemeMode);
  return (
    <>
      <PageHeading
        title="Configurações"
        description="Gerencie a operação global e as preferências do backoffice."
      />
      <PlatformControls />
      <Accordion type="single" collapsible className="mt-5">
      <AccordionItem value="preferences">
      <AccordionTrigger>Minha conta e aparência</AccordionTrigger>
      <AccordionContent className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">Conta administrativa</h2>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Nome</dt>
              <dd className="mt-1">{user.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="mt-1 break-all">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Papel</dt>
              <dd className="mt-1">SUPER_ADMIN</dd>
            </div>
          </dl>
        </Card>
        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">Aparência</h2>
          <p className="text-sm text-muted-foreground">
            Escolha o tema deste navegador.
          </p>
          <div className="flex flex-wrap gap-3">
            {(
              [
                { value: "light", label: "Claro" },
                { value: "dark", label: "Escuro" },
                { value: "system", label: "Sistema" },
              ] as const
            ).map((option) => (
              <Button
                key={option.value}
                variant={themeMode === option.value ? "default" : "outline"}
                aria-pressed={themeMode === option.value}
                onClick={() => setThemeMode(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </Card>
      </AccordionContent>
      </AccordionItem>
      </Accordion>
    </>
  );
}
