"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Input,
  Label,
  cn,
} from "@thalya-modas/ui";

import { ApiRequestError } from "@/src/shared/api/http-client";

import { login } from "../application/login-api";
import { ArrowRightIcon, LockIcon, MailIcon, ShieldIcon } from "./login-icons";

function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-3 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center text-muted-foreground">
      {children}
    </span>
  );
}

export function LoginForm() {
  const t = useTranslations("login.form");
  const commonErrors = useTranslations("common.errors");
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      router.push("/manager/dashboard");
    },
    onError: (error) => {
      if (error instanceof ApiRequestError) {
        setErrorMessage(error.payload.userMessage ?? error.payload.message ?? commonErrors("signIn"));
        return;
      }

      setErrorMessage(commonErrors("signIn"));
    },
  });

  return (
    <Card className="w-full max-w-[440px] animate-nitro-slide-up border-white/70 bg-card/95 shadow-[0_30px_90px_rgba(0,0,0,0.28)] backdrop-blur-sm">
      <CardContent className="grid gap-6 p-8">
        <header className="grid gap-2">
          <h1 className="text-[28px] font-semibold leading-tight tracking-normal text-card-foreground">
            {t("title")}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">{t("description")}</p>
        </header>

        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            setErrorMessage(null);

            const formData = new FormData(event.currentTarget);
            loginMutation.mutate({
              email: String(formData.get("email") ?? ""),
              password: String(formData.get("password") ?? ""),
              rememberMe: formData.get("rememberMe") === "on",
            });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <div className="relative">
              <FieldIcon>
                <MailIcon className="size-4" />
              </FieldIcon>
              <Input
                id="email"
                name="email"
                autoComplete="email"
                className="h-11 pl-10"
                defaultValue="ana@thalyamodas.com"
                inputMode="email"
                placeholder={t("emailPlaceholder")}
                type="email"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">{t("passwordLabel")}</Label>
            <div className="relative">
              <FieldIcon>
                <LockIcon className="size-4" />
              </FieldIcon>
              <Input
                id="password"
                name="password"
                autoComplete="current-password"
                className="h-11 pl-10"
                defaultValue="Password123"
                type="password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal text-foreground">
              <Checkbox defaultChecked name="rememberMe" />
              {t("rememberLabel")}
            </Label>
            <Link
              className="text-sm font-semibold text-primary underline-offset-4 transition-colors duration-fast ease-nitro hover:text-primary/80 hover:underline"
              href="/recover-password"
            >
              {t("forgotPasswordLabel")}
            </Link>
          </div>

          {errorMessage ? (
            <p className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <Button
            className="h-[46px] w-full justify-between px-5"
            disabled={loginMutation.isPending}
            type="submit"
          >
            <span>{loginMutation.isPending ? t("submittingLabel") : t("submitLabel")}</span>
            <ArrowRightIcon className="size-4" />
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground">{t("dividerLabel")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          className={cn(
            "h-11 w-full border-input bg-card text-foreground hover:bg-accent",
            "shadow-none",
          )}
          variant="outline"
        >
          <ShieldIcon className="size-4" />
          {t("ssoLabel")}
        </Button>

        <footer className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <span>{t("accessPrompt")}</span>
          <Link
            className="font-semibold text-primary underline-offset-4 transition-colors duration-fast ease-nitro hover:text-primary/80 hover:underline"
            href="/auth/login"
          >
            {t("accessLinkLabel")}
          </Link>
        </footer>
      </CardContent>
    </Card>
  );
}
