"use client";

import { ErrorReference } from "@/src/shared/ui/error-reference";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Input,
  Label,
} from "@store-flow/ui";

import { apiRequest, ApiRequestError } from "@/src/shared/api/http-client";
import { getBackofficeDestination } from "@/src/shared/auth/role-destination";
import { clearLastStoreCookie } from "@/src/shared/store/last-store-cookie";

import { login } from "../application/login-api";
import { ArrowRightIcon, LockIcon, MailIcon } from "./login-icons";

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
  const queryClient = useQueryClient();
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000)));
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [blockedUntil]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (result) => {
      queryClient.clear();
      clearLastStoreCookie();
      const me = await apiRequest<{ entryDestination?: string }>("/auth/me");
      router.replace(me.entryDestination ?? getBackofficeDestination(result.user.role));
      router.refresh();
    },
    onError: (error) => {
      if (error instanceof ApiRequestError) {
        setErrorMessage(error.payload.userMessage);
        const details = error.payload.details as { retryAfter?: number } | undefined;
        if (error.status === 429 && typeof details?.retryAfter === 'number') setBlockedUntil(Date.now() + details.retryAfter * 1000);
        return;
      }

      setErrorMessage(commonErrors("signIn"));
    },
  });

  return (
    <Card className="w-full bg-card shadow-none">
      <CardContent className="grid gap-5 p-6">
        <header className="grid gap-2">
          <h1 className="text-2xl font-semibold leading-tight tracking-normal text-card-foreground">
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
                placeholder={t("passwordPlaceholder")}
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
            <p role="alert" className="break-words border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <ErrorReference error={loginMutation.error} />
          <Button
            className="h-[46px] w-full justify-between px-5"
            disabled={loginMutation.isPending || remaining > 0}
            type="submit"
          >
            <span>{remaining > 0 ? `Tente novamente em ${remaining}s` : loginMutation.isPending ? t("submittingLabel") : t("submitLabel")}</span>
            <ArrowRightIcon className="size-4" />
          </Button>
        </form>

        <footer className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <span>Ainda não tem uma conta?</span>
          <Link
            className="font-semibold text-primary underline-offset-4 transition-colors duration-fast ease-nitro hover:text-primary/80 hover:underline"
            href="/auth/register"
          >
            Criar conta
          </Link>
        </footer>
      </CardContent>
    </Card>
  );
}
