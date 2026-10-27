"use client";
import Link from "next/link";
import { SidebarDropdownContent, sidebarDropdownTriggerClassName } from "./sidebar-dropdown";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Bell, CaretUpDown, CreditCard, Desktop, GearSix, Moon, Palette, SignOut, Storefront, Sun, Translate, UsersThree } from "@phosphor-icons/react";
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, cn } from "@store-flow/ui";
import { logout } from "@/src/features/auth/logout/application/logout-api";
import { appConfig } from "@/src/shared/config/app";
import type { AppLocale } from "@/src/shared/i18n/locales";
import { useAppUiStore } from "@/src/shared/state/app-ui-store";
import type { ThemeMode } from "@/src/shared/theme/theme-cookie";
const themeOptions = [
  { icon: Sun, labelKey: "light", value: "light" },
  { icon: Moon, labelKey: "dark", value: "dark" },
  { icon: Desktop, labelKey: "system", value: "system" },
] as const satisfies ReadonlyArray<{
  icon: typeof Sun;
  labelKey: "dark" | "light" | "system";
  value: ThemeMode;
}>;

const localeOptions = ["pt-BR", "en", "es"] as const satisfies ReadonlyArray<AppLocale>;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts.at(-1)?.[0] : "";

  return `${first}${last}`.toUpperCase() || "SF";
}

export function AccountQuickMenu({
  basePath,
  operatorName,
  operatorRole,
  settingsActive,
  platform = false,
  onNavigate,
}: {
  basePath: string;
  operatorName: string;
  operatorRole: string;
  settingsActive?: boolean;
  platform?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const shell = useTranslations("dashboard.shell");
  const theme = useTranslations("common.theme");
  const activeStore = useAppUiStore((state) => state.activeStore);
  const closeMobileNavigation = useAppUiStore((state) => state.closeMobileNavigation);
  const locale = useAppUiStore((state) => state.locale);
  const setLocale = useAppUiStore((state) => state.setLocale);
  const themeMode = useAppUiStore((state) => state.themeMode);
  const setThemeMode = useAppUiStore((state) => state.setThemeMode);
  const closeNavigation = () => { closeMobileNavigation(); onNavigate?.(); };
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      closeNavigation();
      useAppUiStore.getState().setActiveStore(null);
      queryClient.clear();
      router.push("/auth/login");
    },
  });
  const settingsLinks = platform ? [
    { href: "/backoffice/settings", icon: GearSix, label: shell("settings.general") },
    { href: "/backoffice/users", icon: UsersThree, label: shell("settings.teamSecurity") },
  ] : [
    { href: `${basePath}/settings/plan`, icon: CreditCard, label: "Plano da empresa" },
    {
      href: `${basePath}/settings`,
      icon: GearSix,
      label: shell("settings.general"),
    },
    {
      href: `${basePath}/settings/store`,
      icon: Storefront,
      label: shell("settings.store"),
    },
    {
      href: `${basePath}/settings/payments`,
      icon: CreditCard,
      label: shell("settings.payments"),
    },
    {
      href: `${basePath}/settings/team-security`,
      icon: UsersThree,
      label: shell("settings.teamSecurity"),
    },
    {
      href: `${basePath}/settings/notifications`,
      icon: Bell,
      label: shell("settings.notifications"),
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-current={settingsActive ? "page" : undefined}
          aria-label={shell("accountMenu")}
          className={cn(
            sidebarDropdownTriggerClassName,
            settingsActive &&
              "border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground",
          )}
          type="button"
        >
          <div className="flex size-9 shrink-0 items-center justify-center bg-muted text-sm font-semibold text-foreground">
            {getInitials(operatorName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-inherit">{operatorName}</p>
            <p className={cn("truncate text-xs group-hover:text-sidebar-accent-foreground", settingsActive ? "text-sidebar-accent-foreground" : "text-muted-foreground")}>{operatorRole}</p>
          </div>
          <CaretUpDown
            aria-hidden="true"
            className={cn("size-4 shrink-0 transition-colors group-hover:text-sidebar-accent-foreground", settingsActive ? "text-sidebar-accent-foreground" : "text-muted-foreground")}
          />
        </button>
      </DropdownMenuTrigger>

      <SidebarDropdownContent>
        <DropdownMenuLabel className="p-3 font-normal">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
              {getInitials(operatorName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {operatorName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {platform ? "Administra\u00e7\u00e3o da plataforma" : activeStore?.name ?? appConfig.context} · {operatorRole}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>{shell("settingsSection")}</DropdownMenuLabel>
        {settingsLinks.map(({ href, icon: Icon, label }) => (
          <DropdownMenuItem asChild className="min-h-11 cursor-pointer" key={href}>
            <Link href={href} onClick={closeNavigation}>
              <Icon className="size-4 text-muted-foreground" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>{shell("quickPreferences")}</DropdownMenuLabel>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="min-h-11 cursor-pointer">
            <Palette className="size-4 text-muted-foreground" />
            <span>{theme("title")}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {theme(themeMode)}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-44">
            <DropdownMenuRadioGroup
              onValueChange={(value) => setThemeMode(value as ThemeMode)}
              value={themeMode}
            >
              {themeOptions.map(({ icon: Icon, labelKey, value }) => (
                <DropdownMenuRadioItem
                  className="min-h-11 cursor-pointer"
                  key={value}
                  value={value}
                >
                  <Icon className="size-4" />
                  {theme(labelKey)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="min-h-11 cursor-pointer">
            <Translate className="size-4 text-muted-foreground" />
            <span>{shell("language")}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {shell(`languages.${locale}`)}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52">
            <DropdownMenuRadioGroup
              onValueChange={(value) => setLocale(value as AppLocale)}
              value={locale}
            >
              {localeOptions.map((value) => (
                <DropdownMenuRadioItem
                  className="min-h-11 cursor-pointer"
                  key={value}
                  value={value}
                >
                  {shell(`languages.${value}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        {logoutMutation.isError ? (
          <DropdownMenuLabel
            className="whitespace-normal px-2 py-2 text-destructive"
            role="alert"
          >
            {shell("signOutError")}
          </DropdownMenuLabel>
        ) : null}
        <DropdownMenuItem
          className="min-h-11 cursor-pointer text-destructive focus:text-destructive"
          disabled={logoutMutation.isPending}
          onSelect={(event) => {
            event.preventDefault();
            logoutMutation.mutate();
          }}
        >
          <SignOut className="size-4" />
          {logoutMutation.isPending ? shell("signingOut") : shell("signOut")}
        </DropdownMenuItem>
      </SidebarDropdownContent>
    </DropdownMenu>
  );
}
