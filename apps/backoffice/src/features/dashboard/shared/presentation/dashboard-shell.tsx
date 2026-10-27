"use client";
import { useOperationalSidebar, useOperationalToolbar } from "./operational-context";

import { SidebarNavigation } from "@/src/shared/ui/sidebar-navigation";
import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  IconButton,
  PageLayout,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  cn,
} from "@store-flow/ui";

import { AccountQuickMenu } from "@/src/shared/ui/account-quick-menu";
import { getCurrentUser } from "@/src/features/auth/session/application/current-user-api";
import { appConfig } from "@/src/shared/config/app";
import { useAppUiStore } from "@/src/shared/state/app-ui-store";
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

function StoreSidebar({
  activeItem,
  className,
  operatorRole,
  settingsActive,
  status,
}: Omit<DashboardShellProps, "children"> & { className?: string }) {
  const branchSwitcher = useOperationalSidebar();
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
        {branchSwitcher ?? <BrandMark context={activeStore?.name ?? appConfig.context} name={appConfig.name} />}
        {!branchSwitcher && <div className="flex items-center gap-2 bg-muted px-3 py-2 text-sm text-foreground">
          <ClockIcon className="size-4 text-success-foreground" />
          <span>{status}</span>
        </div>}
      </SidebarHeader>

      <SidebarContent className="grid content-start gap-1 p-2">
        <SidebarNavigation label="Navegação da loja" onNavigate={closeMobileNavigation} groups={[
          { id: "operations", label: "Operação", segments: ["", "orders", "cash-register"] },
          { id: "records", label: "Cadastros", segments: ["inventory", "customers", "suppliers"] },
          { id: "management", label: "Gestão", segments: ["reports", "about"] },
        ].map(group => ({ id: group.id, label: group.label, items: dashboardNavigation.filter(item => group.segments.includes(item.segment)).map(item => {
          const Icon = navIcons[dashboardNavigation.indexOf(item)] ?? ChartIcon;
          return { href: item.segment ? `${basePath}/${item.segment}` : basePath, label: navigation(item.i18nKey), active: item.label === activeItem, icon: <Icon aria-hidden="true" className="size-4 shrink-0" /> };
        }) }))} />
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
  const branchSwitcher = useOperationalSidebar();
  const toggleMobileNavigation = useAppUiStore((state) => state.toggleMobileNavigation);
  const activeStore = useAppUiStore((state) => state.activeStore);
  const shell = useTranslations("dashboard.shell");

  return (
    <div className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 lg:hidden">
      <div className="min-w-0 flex-1 pr-2">{branchSwitcher ?? <BrandMark context={activeStore?.name ?? appConfig.context} name={appConfig.name} />}</div>
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
  const contextToolbar=useOperationalToolbar();
  return (
    <main className="min-h-screen max-w-full overflow-x-clip bg-background text-foreground">
      <MobileHeader />
      <MobileNavigationDrawer
        activeItem={activeItem}
        operatorRole={operatorRole}
        settingsActive={settingsActive}
        status={status}
      />
      <div className="flex min-h-screen min-w-0 max-w-full items-stretch overflow-x-clip">
        <StoreSidebar
          activeItem={activeItem}
          className="sticky top-0 hidden h-screen lg:flex"
          operatorRole={operatorRole}
          settingsActive={settingsActive}
          status={status}
        />
        <section className="grid min-w-0 max-w-full flex-1 content-start gap-4 overflow-x-clip p-4 lg:p-5">
          <PageLayout>{contextToolbar}{children}</PageLayout>
        </section>
      </div>
    </main>
  );
}
