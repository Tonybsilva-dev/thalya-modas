"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Button,
  Card,
  CardContent,
  IconButton,
  Input,
  Label,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@thalya-modas/ui";

import { BrandMark } from "@/src/shared/ui/brand-mark";

import type { RecoverPasswordStep } from "../domain/recover-password-content";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  LockIcon,
  MailIcon,
  ShieldIcon,
} from "./recover-password-icons";

type RecoverPasswordRouteProps = {
  brandName?: string;
  step: RecoverPasswordStep;
};

const stepOrder: RecoverPasswordStep[] = ["request", "code", "reset", "success"];

const nextHref: Record<RecoverPasswordStep, string> = {
  code: "/recover-password/reset",
  request: "/recover-password/code",
  reset: "/recover-password/success",
  success: "/manager/dashboard",
};

const previousHref: Partial<Record<RecoverPasswordStep, string>> = {
  code: "/recover-password",
  request: "/auth/login",
  reset: "/recover-password/code",
  success: "/auth/login",
};

function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-3 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center text-muted-foreground">
      {children}
    </span>
  );
}

function RecoveryShell({
  brandName,
  children,
  step,
}: {
  brandName?: string;
  children: ReactNode;
  step: RecoverPasswordStep;
}) {
  const t = useTranslations("recoverPassword");
  const bullets = t.raw("shared.bullets") as string[];

  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[560px_minmax(0,1fr)]">
      <aside className="flex min-h-[320px] flex-col justify-between gap-7 bg-secondary p-8 text-secondary-foreground sm:p-12 lg:min-h-screen">
        <div className="grid gap-7">
          <div className="grid gap-[18px]">
            <BrandMark name={brandName ?? t("shared.brand")} showContext={false} tone="light" />

            <div className="grid max-w-[420px] gap-3">
              <h1 className="text-[34px] font-bold leading-tight text-secondary-foreground">
                {t(`${step}.heroTitle`)}
              </h1>
              <p className="text-base leading-7 text-white/80">
                {t(`${step}.heroDescription`)}
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {bullets.map((bullet) => (
              <div key={bullet} className="flex items-center gap-2.5">
                <CheckIcon className="size-4 text-primary" />
                <span className="text-sm text-white/90">{bullet}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="grid min-h-screen content-center justify-items-center gap-[18px] p-6 sm:p-10 lg:p-16">
        <StepIndicator step={step} />
        {children}
      </section>
    </main>
  );
}

function StepIndicator({ step }: { step: RecoverPasswordStep }) {
  const activeIndex = stepOrder.indexOf(step);

  return (
    <div className="flex w-full max-w-[520px] justify-end gap-2">
      {stepOrder.map((item, index) => (
        <div
          key={item}
          className={cn(
            "h-1.5 border border-border bg-muted",
            index <= activeIndex && "border-primary bg-primary",
            index === activeIndex ? "w-[54px]" : "w-[34px]",
          )}
        />
      ))}
    </div>
  );
}

function RecoveryCard({ children }: { children: ReactNode }) {
  return (
    <Card className="w-full max-w-[520px]">
      <CardContent className="grid gap-[22px] p-8">{children}</CardContent>
    </Card>
  );
}

function CardIntro({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="grid gap-2.5">
      <h2 className="text-[28px] font-bold leading-tight text-foreground">{title}</h2>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function LinkButton({
  children,
  href,
  variant = "default",
  className,
}: {
  children: ReactNode;
  className?: string;
  href: string;
  variant?: "default" | "outline";
}) {
  return (
    <Button asChild className={cn("h-11 w-full justify-center", className)} variant={variant}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}

function BackIconLinkButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton aria-label={label} asChild className="size-11 shrink-0" variant="outline">
            <Link href={href}>
              <ArrowLeftIcon className="size-4" />
            </Link>
          </IconButton>
        </TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ActionRow({
  backHref,
  backLabel,
  children,
}: {
  backHref: string;
  backLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <BackIconLinkButton href={backHref} label={backLabel} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function RequestStep({ brandName }: { brandName?: string }) {
  const t = useTranslations("recoverPassword");

  return (
    <RecoveryShell brandName={brandName} step="request">
      <RecoveryCard>
        <CardIntro description={t("request.description")} title={t("request.title")} />

        <div className="grid gap-1.5">
          <Label htmlFor="recovery-email">{t("request.emailLabel")}</Label>
          <div className="relative">
            <FieldIcon>
              <MailIcon className="size-[18px]" />
            </FieldIcon>
            <Input
              id="recovery-email"
              autoComplete="email"
              className="h-11 pl-10"
              inputMode="email"
              placeholder={t("request.emailPlaceholder")}
              type="email"
            />
          </div>
        </div>

        <ActionRow
          backHref={previousHref.request ?? "/auth/login"}
          backLabel={t("shared.backToLogin")}
        >
          <LinkButton href={nextHref.request}>
            {t("request.primaryAction")}
            <ArrowRightIcon className="size-4" />
          </LinkButton>
        </ActionRow>
      </RecoveryCard>
    </RecoveryShell>
  );
}

function CodeStep({ brandName }: { brandName?: string }) {
  const t = useTranslations("recoverPassword");
  const code = Array.from({ length: 6 }, (_, index) => index);

  return (
    <RecoveryShell brandName={brandName} step="code">
      <RecoveryCard>
        <CardIntro description={t("code.description")} title={t("code.title")} />

        <div className="grid grid-cols-6 gap-2.5">
          {code.map((index) => (
            <div
              key={index}
              className="grid h-14 place-items-center border border-input bg-card text-xl font-semibold text-foreground"
            />
          ))}
        </div>

        <ActionRow
          backHref={previousHref.code ?? "/recover-password"}
          backLabel={t("shared.backToEmail")}
        >
          <LinkButton href={nextHref.code}>
            {t("code.primaryAction")}
            <ArrowRightIcon className="size-4" />
          </LinkButton>
        </ActionRow>
        <Button className="h-11 w-full justify-center" variant="outline">
          {t("code.secondaryAction")}
        </Button>
      </RecoveryCard>
    </RecoveryShell>
  );
}

function ResetStep({ brandName }: { brandName?: string }) {
  const t = useTranslations("recoverPassword");

  return (
    <RecoveryShell brandName={brandName} step="reset">
      <RecoveryCard>
        <CardIntro description={t("reset.description")} title={t("reset.title")} />

        {[
          [t("reset.passwordLabel"), "new-password", LockIcon],
          [t("reset.confirmPasswordLabel"), "confirm-password", LockIcon],
        ].map(([label, id, Icon]) => (
          <div key={id as string} className="grid gap-1.5">
            <Label htmlFor={id as string}>{label as string}</Label>
            <div className="relative">
              <FieldIcon>
                <Icon className="size-[18px]" />
              </FieldIcon>
              <Input
                id={id as string}
                autoComplete="new-password"
                className="h-11 pl-10"
                placeholder={t("reset.passwordPlaceholder")}
                type="password"
              />
            </div>
          </div>
        ))}

        <div className="flex gap-2.5 border border-border bg-muted p-3">
          <ShieldIcon className="mt-0.5 size-[18px] shrink-0 text-primary" />
          <p className="text-sm leading-5 text-muted-foreground">{t("reset.hint")}</p>
        </div>

        <ActionRow
          backHref={previousHref.reset ?? "/recover-password/code"}
          backLabel={t("shared.backToCode")}
        >
          <LinkButton href={nextHref.reset}>
            {t("reset.primaryAction")}
            <ArrowRightIcon className="size-4" />
          </LinkButton>
        </ActionRow>
      </RecoveryCard>
    </RecoveryShell>
  );
}

function SuccessStep({ brandName }: { brandName?: string }) {
  const t = useTranslations("recoverPassword");

  return (
    <RecoveryShell brandName={brandName} step="success">
      <RecoveryCard>
        <div className="flex gap-4">
          <div className="grid size-16 shrink-0 place-items-center border border-success-foreground bg-success text-success-foreground">
            <CheckIcon className="size-[30px]" />
          </div>
          <CardIntro description={t("success.description")} title={t("success.title")} />
        </div>

        <ActionRow
          backHref={previousHref.success ?? "/auth/login"}
          backLabel={t("success.secondaryAction")}
        >
          <LinkButton href={nextHref.success}>
            {t("success.primaryAction")}
            <ArrowRightIcon className="size-4" />
          </LinkButton>
        </ActionRow>
      </RecoveryCard>
    </RecoveryShell>
  );
}

export function RecoverPasswordRoute({ brandName, step }: RecoverPasswordRouteProps) {
  const routes: Record<RecoverPasswordStep, ReactNode> = {
    code: <CodeStep brandName={brandName} />,
    request: <RequestStep brandName={brandName} />,
    reset: <ResetStep brandName={brandName} />,
    success: <SuccessStep brandName={brandName} />,
  };

  return routes[step];
}
