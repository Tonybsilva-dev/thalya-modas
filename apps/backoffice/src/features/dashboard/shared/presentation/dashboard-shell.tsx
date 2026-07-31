"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Bell,
  CaretUpDown,
  CreditCard,
  Desktop,
  GearSix,
  Moon,
  Palette,
  SignOut,
  Storefront,
  Sun,
  Translate,
  UsersThree,
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  IconButton,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  cn,
} from "@thalya-modas/ui";

import { logout } from "@/src/features/auth/logout/application/logout-api";
import { getCurrentUser } from "@/src/features/auth/session/application/current-user-api";
import { appConfig } from "@/src/shared/config/app";
import type { AppLocale } from "@/src/shared/i18n/locales";
import { useAppUiStore } from "@/src/shared/state/app-ui-store";
import type { ThemeMode } from "@/src/shared/theme/theme-cookie";
import { BrandMark } from "@/src/shared/ui/brand-mark";

import {
  BoxIcon,
  InfoIcon,
  ChartIcon,
  ClockIcon,
  MenuIcon,
  UsersIcon,
} from "../../overview/presentation/dashboard-icons";
import {
  dashboardNavigation,
  type DashboardNavigationLabel,
} from "../domain/dashboard-navigation";

const navIcons = [
  ChartIcon,
  BoxIcon,
  BoxIcon,
  UsersIcon,
  ClockIcon,
  BoxIcon,
  ChartIcon,
  InfoIcon,
];

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

type DashboardShellProps = {
  activeItem?: DashboardNavigationLabel;
  children: ReactNode;
  operatorRole: string;
  settingsActive?: boolean;
  status: string;
};

function useDashboardBasePath() {
  const params = useParams<{ role?: string }>();
  const role = params.role ?? "manager";

  return `/${role}/dashboard`;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts.at(-1)?.[0] : "";

  return `${first}${last}`.toUpperCase() || "SF";
}

function getRoleTranslationKey(role?: string) {
  const normalizedRole = role?.replace(/^ROLE_/, "").toLowerCase();

  if (
    normalizedRole === "admin" ||
    normalizedRole === "company" ||
    normalizedRole === "customer" ||
    normalizedRole === "manager" ||
    normalizedRole === "operator" ||
    normalizedRole === "super_admin"
  ) {
    return normalizedRole;
  }

  return "default";
}

function AccountQuickMenu({
  basePath,
  operatorName,
  operatorRole,
  settingsActive,
}: {
  basePath: string;
  operatorName: string;
  operatorRole: string;
  settingsActive?: boolean;
}) {
  const router = useRouter();
  const shell = useTranslations("dashboard.shell");
  const theme = useTranslations("common.theme");
  const activeStore = useAppUiStore((state) => state.activeStore);
  const closeMobileNavigation = useAppUiStore((state) => state.closeMobileNavigation);
  const locale = useAppUiStore((state) => state.locale);
  const setLocale = useAppUiStore((state) => state.setLocale);
  const themeMode = useAppUiStore((state) => state.themeMode);
  const setThemeMode = useAppUiStore((state) => state.setThemeMode);
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      closeMobileNavigation();
      router.push("/auth/login");
    },
  });
  const settingsLinks = [
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
            "group flex w-full cursor-pointer items-center gap-3 border border-transparent p-2 text-left transition-colors hover:border-sidebar-border hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            settingsActive &&
              "border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground",
          )}
          type="button"
        >
          <div className="flex size-9 shrink-0 items-center justify-center bg-muted text-sm font-semibold text-foreground">
            {getInitials(operatorName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{operatorName}</p>
            <p className="truncate text-xs text-muted-foreground">{operatorRole}</p>
          </div>
          <CaretUpDown
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="max-h-[calc(100vh-2rem)] w-[min(320px,calc(100vw-2rem))] overflow-y-auto p-1.5"
        collisionPadding={12}
        side="right"
        sideOffset={12}
      >
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
                {activeStore?.name ?? appConfig.context} · {operatorRole}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>{shell("settingsSection")}</DropdownMenuLabel>
        {settingsLinks.map(({ href, icon: Icon, label }) => (
          <DropdownMenuItem asChild className="h-9 cursor-pointer" key={href}>
            <Link href={href} onClick={closeMobileNavigation}>
              <Icon className="size-4 text-muted-foreground" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>{shell("quickPreferences")}</DropdownMenuLabel>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="h-9 cursor-pointer">
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
                  className="h-9 cursor-pointer"
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
          <DropdownMenuSubTrigger className="h-9 cursor-pointer">
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
                  className="h-9 cursor-pointer"
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
          className="h-9 cursor-pointer text-destructive focus:text-destructive"
          disabled={logoutMutation.isPending}
          onSelect={(event) => {
            event.preventDefault();
            logoutMutation.mutate();
          }}
        >
          <SignOut className="size-4" />
          {logoutMutation.isPending ? shell("signingOut") : shell("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StoreSidebar({
  activeItem,
  className,
  operatorRole,
  settingsActive,
  status,
}: Omit<DashboardShellProps, "children"> & { className?: string }) {
  const basePath = useDashboardBasePath();
  const closeMobileNavigation = useAppUiStore((state) => state.closeMobileNavigation);
  const activeStore = useAppUiStore((state) => state.activeStore);
  const navigation = useTranslations("dashboard.navigation");
  const shell = useTranslations("dashboard.shell");
  const currentUserQuery = useQuery({
    queryFn: getCurrentUser,
    queryKey: ["auth", "current-user"],
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
  const currentUser = currentUserQuery.data;
  const operatorName = currentUser?.name ?? shell("userFallback");
  const resolvedOperatorRole = currentUser
    ? shell(`roles.${getRoleTranslationKey(currentUser.role)}`)
    : operatorRole;

  return (
    <Sidebar className={cn("shrink-0", className)}>
      <SidebarHeader className="grid gap-4">
        <BrandMark context={activeStore?.name ?? appConfig.context} name={appConfig.name} />
        <div className="flex items-center gap-2 bg-muted px-3 py-2 text-sm text-foreground">
          <ClockIcon className="size-4 text-success-foreground" />
          <span>{status}</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="grid content-start gap-1 p-2">
        {dashboardNavigation.map((item, index) => {
          const Icon = navIcons[index] ?? ChartIcon;
          const href = item.segment ? `${basePath}/${item.segment}` : basePath;

          return (
            <SidebarItem
              key={item.label}
              active={item.label === activeItem}
              asChild
              className="h-11 px-4 text-[15px]"
              onClick={closeMobileNavigation}
            >
              <Link href={href}>
                <Icon className="size-5" />
                {navigation(item.i18nKey)}
              </Link>
            </SidebarItem>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <AccountQuickMenu
          basePath={basePath}
          operatorName={operatorName}
          operatorRole={resolvedOperatorRole}
          settingsActive={settingsActive}
        />
      </SidebarFooter>
    </Sidebar>
  );
}

function MobileHeader() {
  const toggleMobileNavigation = useAppUiStore((state) => state.toggleMobileNavigation);
  const activeStore = useAppUiStore((state) => state.activeStore);
  const shell = useTranslations("dashboard.shell");

  return (
    <div className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 lg:hidden">
      <BrandMark context={activeStore?.name ?? appConfig.context} name={appConfig.name} />
      <IconButton aria-label={shell("openNavigation")} onClick={toggleMobileNavigation} variant="ghost">
        <MenuIcon className="size-5" />
      </IconButton>
    </div>
  );
}

function MobileNavigationDrawer({
  activeItem,
  operatorRole,
  settingsActive,
  status,
}: Omit<DashboardShellProps, "children">) {
  const isMobileNavigationOpen = useAppUiStore((state) => state.isMobileNavigationOpen);
  const closeMobileNavigation = useAppUiStore((state) => state.closeMobileNavigation);
  const shell = useTranslations("dashboard.shell");

  if (!isMobileNavigationOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        aria-label={shell("closeNavigation")}
        className="absolute inset-0 bg-black/40"
        onClick={closeMobileNavigation}
        type="button"
      />
      <StoreSidebar
        activeItem={activeItem}
        className="relative h-full animate-nitro-slide-right"
        operatorRole={operatorRole}
        settingsActive={settingsActive}
        status={status}
      />
    </div>
  );
}

export function DashboardShell({
  activeItem,
  children,
  operatorRole,
  settingsActive,
  status,
}: DashboardShellProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <MobileHeader />
      <MobileNavigationDrawer
        activeItem={activeItem}
        operatorRole={operatorRole}
        settingsActive={settingsActive}
        status={status}
      />
      <div className="flex min-h-screen items-stretch">
        <StoreSidebar
          activeItem={activeItem}
          className="sticky top-0 hidden h-screen lg:flex"
          operatorRole={operatorRole}
          settingsActive={settingsActive}
          status={status}
        />
        <section className="grid min-w-0 flex-1 content-start gap-5 p-4 md:p-6 lg:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}
