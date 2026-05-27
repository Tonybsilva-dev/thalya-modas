"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Button, Card, CardContent, Input, Label, cn } from "@thalya-modas/ui";

import {
  recoverPasswordContent,
  type RecoverPasswordStep,
} from "../domain/recover-password-content";
import {
  ArrowRightIcon,
  CheckIcon,
  LockIcon,
  MailIcon,
  ShieldIcon,
  StoreIcon,
} from "./recover-password-icons";

type RecoverPasswordRouteProps = {
  step: RecoverPasswordStep;
};

const stepOrder: RecoverPasswordStep[] = ["request", "code", "reset", "success"];

const nextHref: Record<RecoverPasswordStep, string> = {
  code: "/recover-password/reset",
  request: "/recover-password/code",
  reset: "/recover-password/success",
  success: "/manager/dashboard",
};

function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-3 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center text-muted-foreground">
      {children}
    </span>
  );
}

function RecoveryShell({
  children,
  step,
}: {
  children: ReactNode;
  step: RecoverPasswordStep;
}) {
  const content = recoverPasswordContent[step];

  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[560px_minmax(0,1fr)]">
      <aside className="flex min-h-[320px] flex-col justify-between gap-7 bg-secondary p-8 text-secondary-foreground sm:p-12 lg:min-h-screen">
        <div className="grid gap-7">
          <div className="grid gap-[18px]">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center bg-primary text-primary-foreground">
                <StoreIcon className="size-[22px]" />
              </div>
              <span className="text-lg font-semibold">
                {recoverPasswordContent.shared.brand}
              </span>
            </div>

            <div className="grid max-w-[420px] gap-3">
              <h1 className="text-[34px] font-bold leading-tight text-secondary-foreground">
                {content.heroTitle}
              </h1>
              <p className="text-base leading-7 text-white/80">
                {content.heroDescription}
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {recoverPasswordContent.shared.bullets.map((bullet) => (
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
    <div className="flex w-full max-w-[520px] gap-2">
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
}: {
  children: ReactNode;
  href: string;
  variant?: "default" | "outline";
}) {
  return (
    <Button asChild className="h-11 w-full justify-center" variant={variant}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}

function RequestStep() {
  const content = recoverPasswordContent.request;

  return (
    <RecoveryShell step="request">
      <RecoveryCard>
        <CardIntro description={content.description} title={content.title} />

        <div className="grid gap-1.5">
          <Label htmlFor="recovery-email">{content.emailLabel}</Label>
          <div className="relative">
            <FieldIcon>
              <MailIcon className="size-[18px]" />
            </FieldIcon>
            <Input
              id="recovery-email"
              autoComplete="email"
              className="h-11 pl-10"
              defaultValue={content.emailPlaceholder}
              inputMode="email"
              type="email"
            />
          </div>
        </div>

        <LinkButton href={nextHref.request}>
          {content.primaryAction}
          <ArrowRightIcon className="size-4" />
        </LinkButton>
        <LinkButton href="/auth/login" variant="outline">
          {content.secondaryAction}
        </LinkButton>
      </RecoveryCard>
    </RecoveryShell>
  );
}

function CodeStep() {
  const content = recoverPasswordContent.code;

  return (
    <RecoveryShell step="code">
      <RecoveryCard>
        <CardIntro description={content.description} title={content.title} />

        <div className="grid grid-cols-6 gap-2.5">
          {content.code.map((digit, index) => (
            <div
              key={`${digit}-${index}`}
              className={cn(
                "grid h-14 place-items-center border bg-card text-xl font-semibold text-foreground",
                digit ? "border-primary" : "border-input",
              )}
            >
              {digit}
            </div>
          ))}
        </div>

        <LinkButton href={nextHref.code}>
          {content.primaryAction}
          <ArrowRightIcon className="size-4" />
        </LinkButton>
        <Button className="h-11 w-full justify-center" variant="outline">
          {content.secondaryAction}
        </Button>
      </RecoveryCard>
    </RecoveryShell>
  );
}

function ResetStep() {
  const content = recoverPasswordContent.reset;

  return (
    <RecoveryShell step="reset">
      <RecoveryCard>
        <CardIntro description={content.description} title={content.title} />

        {[
          [content.passwordLabel, "new-password", LockIcon],
          [content.confirmPasswordLabel, "confirm-password", LockIcon],
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
                defaultValue={content.passwordValue}
                type="password"
              />
            </div>
          </div>
        ))}

        <div className="flex gap-2.5 border border-border bg-muted p-3">
          <ShieldIcon className="mt-0.5 size-[18px] shrink-0 text-primary" />
          <p className="text-sm leading-5 text-muted-foreground">{content.hint}</p>
        </div>

        <LinkButton href={nextHref.reset}>
          {content.primaryAction}
          <ArrowRightIcon className="size-4" />
        </LinkButton>
      </RecoveryCard>
    </RecoveryShell>
  );
}

function SuccessStep() {
  const content = recoverPasswordContent.success;

  return (
    <RecoveryShell step="success">
      <RecoveryCard>
        <div className="flex gap-4">
          <div className="grid size-16 shrink-0 place-items-center border border-success-foreground bg-success text-success-foreground">
            <CheckIcon className="size-[30px]" />
          </div>
          <CardIntro description={content.description} title={content.title} />
        </div>

        <LinkButton href={nextHref.success}>
          {content.primaryAction}
          <ArrowRightIcon className="size-4" />
        </LinkButton>
        <LinkButton href="/auth/login" variant="outline">
          {content.secondaryAction}
        </LinkButton>
      </RecoveryCard>
    </RecoveryShell>
  );
}

export function RecoverPasswordRoute({ step }: RecoverPasswordRouteProps) {
  const routes: Record<RecoverPasswordStep, ReactNode> = {
    code: <CodeStep />,
    request: <RequestStep />,
    reset: <ResetStep />,
    success: <SuccessStep />,
  };

  return routes[step];
}
