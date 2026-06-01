import type { CSSProperties, ReactNode } from "react";
import { Button } from "@thalya-modas/ui";
import { appConfig } from "../config/app";

function StatusBackdrop({ children }: { children: ReactNode }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-6 text-foreground">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--border)_70%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--border)_70%,transparent)_1px,transparent_1px)] bg-size-[120px_100px]" />
      <div className="absolute right-[18%] top-[11%] size-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-[12%] left-[8%] size-48 rounded-full bg-warning/40 blur-3xl" />
      <div className="absolute bottom-[12%] right-[9%] size-48 rounded-full bg-success/50 blur-3xl" />
      <div className="relative z-10">{children}</div>
    </main>
  );
}

type GlobalLoadingScreenProps = {
  progress?: number;
};

function LoadingProgress({ progress }: GlobalLoadingScreenProps) {
  const normalizedProgress =
    typeof progress === "number" ? Math.min(100, Math.max(0, progress)) : undefined;
  const isDeterminate = typeof normalizedProgress === "number";

  return (
    <div
      aria-label="Progresso do carregamento"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={isDeterminate ? normalizedProgress : undefined}
      className="h-1.5 w-[280px] overflow-hidden rounded-full bg-border"
      role="progressbar"
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary)_0%,var(--success-foreground)_70%,var(--warning-foreground)_100%)] transition-[transform,width] duration-progress ease-nitro-out data-[indeterminate=true]:animate-[nitro-loading-progress_1200ms_var(--ease-nitro)_infinite]"
        data-indeterminate={!isDeterminate}
        style={
          {
            transform: isDeterminate ? undefined : "translateX(-100%)",
            width: `${isDeterminate ? normalizedProgress : 66}%`,
          } satisfies CSSProperties
        }
      />
    </div>
  );
}

export function GlobalLoadingScreen({ progress }: GlobalLoadingScreenProps) {
  return (
    <StatusBackdrop>
      <section className="grid w-full max-w-[480px] justify-items-center gap-6 text-center">
        <div className="relative size-[148px] animate-nitro-scale-in">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 animate-spin rounded-full bg-[conic-gradient(var(--primary)_0deg,var(--primary)_84deg,transparent_84deg,transparent_360deg)] p-1">
            <div className="size-full rounded-full bg-background" />
          </div>
          <div className="absolute inset-4 animate-spin rounded-full bg-[conic-gradient(transparent_0deg,transparent_226deg,var(--info-foreground)_226deg,var(--info-foreground)_312deg,transparent_312deg,transparent_360deg)] p-1 [animation-direction:reverse]">
            <div className="size-full rounded-full bg-background" />
          </div>
          <div className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10" />
          <div className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-secondary text-secondary-foreground">
            <span className="text-[28px] font-bold leading-none">T</span>
            <span className="h-1 w-5 bg-warning" />
          </div>
          <span className="absolute right-6 top-5 size-3 rounded-full bg-primary" />
          <span className="absolute bottom-7 left-7 size-2 rounded-full bg-warning" />
        </div>

        <div className="grid gap-2">
          <h1 className="text-[32px] font-bold leading-tight">{appConfig.name}</h1>
          <p className="text-[15px] font-medium text-muted-foreground">Carregando...</p>
        </div>

        <LoadingProgress progress={progress} />
      </section>
    </StatusBackdrop>
  );
}

type GlobalErrorScreenProps = {
  description?: string;
  errorCode?: string;
  incidentId?: string;
  level?: "critical" | "error" | "info" | "warning";
  onReport?: () => void;
  onRetry?: () => void;
  title?: string;
};

export function GlobalErrorScreen({
  description = "Não foi possível carregar esta área. Tente novamente ou envie um relatório para o suporte.",
  errorCode,
  incidentId = "INC-20260526-0942",
  level = "error",
  onReport,
  onRetry,
  title = "Algo deu errado",
}: GlobalErrorScreenProps) {
  return (
    <StatusBackdrop>
      <section className="grid w-full max-w-[560px] justify-items-start gap-6">
        <div className="grid size-[104px] place-items-center rounded-full bg-error">
          <div className="grid size-[68px] place-items-center rounded-full bg-card text-[34px] font-bold leading-none text-error-foreground">
            !
          </div>
        </div>

        <div className="grid gap-2">
          <h1 className="text-[34px] font-bold leading-tight">{title}</h1>
          <p className="max-w-[560px] text-[15px] leading-7 text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={onRetry}>Tentar novamente</Button>
          <Button onClick={onReport} variant="outline">
            Enviar relatório
          </Button>
        </div>

        <div className="grid gap-1 text-xs font-semibold text-muted-foreground">
          {errorCode ? <p>Código: {errorCode}</p> : null}
          <p>Nível: {level}</p>
          <p>ID do incidente: {incidentId}</p>
        </div>
      </section>
    </StatusBackdrop>
  );
}
