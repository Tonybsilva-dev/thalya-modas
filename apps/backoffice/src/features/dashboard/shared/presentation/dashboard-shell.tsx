"use client";
import { useOperationalSidebar, useOperationalToolbar } from "./operational-context";

import { SidebarNavigation } from "@/src/shared/ui/sidebar-navigation";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  IconButton,
  PageLayout,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerCloseButton,
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
  rail = false,
}: Omit<DashboardShellProps, "children"> & { className?: string; rail?: boolean }) {
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
      <SidebarHeader className="grid gap-3">
        {rail ? <BrandMark compact name={appConfig.name} /> : branchSwitcher ?? <BrandMark context={activeStore?.name ?? appConfig.context} name={appConfig.name} />}
        {!rail && !branchSwitcher && <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-foreground">
          <ClockIcon className="size-4 text-success-foreground" />
          <span>{status}</span>
        </div>}
      </SidebarHeader>

      <SidebarContent className="grid content-start gap-1 p-2">
        <SidebarNavigation rail={rail} label="Navegação da loja" onNavigate={closeMobileNavigation} groups={[
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
          compact={rail}
          basePath={basePath}
          operatorName={operatorName}
          operatorRole={resolvedOperatorRole}
          settingsActive={settingsActive}
        />
      </SidebarFooter>
    </Sidebar>
  );
}

function WorkspaceHeader({ navigationTrigger }: { navigationTrigger: RefObject<HTMLButtonElement | null> }) {
  const branchSwitcher = useOperationalSidebar();
  const toggleMobileNavigation = useAppUiStore((state) => state.toggleMobileNavigation);
  const isMobileNavigationOpen = useAppUiStore((state) => state.isMobileNavigationOpen);
  const activeStore = useAppUiStore((state) => state.activeStore);
  const shell = useTranslations("dashboard.shell");
  const basePath = useDashboardBasePath();
  const navigation = useTranslations("dashboard.navigation");

  return (
    <header className="flex min-h-[var(--sf-header-height)] items-center justify-between gap-3 border-b border-border/50 bg-sidebar px-[var(--sf-page-gutter)] py-3">
      <div className="min-w-0 w-full max-w-xs">{branchSwitcher ?? <BrandMark context={activeStore?.name ?? appConfig.context} name={appConfig.name} />}</div>
      <nav aria-label={shell("navigationTitle")} className="hidden min-w-0 items-center gap-2 xl:flex">
        {dashboardNavigation.filter(item => ['inventory','orders','customers'].includes(item.segment)).map(item => <Link key={item.segment} href={`${basePath}/${item.segment}`} className="rounded-full border border-border bg-background px-4 py-2 text-xs hover:bg-accent">{navigation(item.i18nKey)}</Link>)}
      </nav>
      <IconButton ref={navigationTrigger} className="lg:hidden" aria-label={shell("openNavigation")} aria-controls="store-navigation" aria-expanded={isMobileNavigationOpen} onClick={toggleMobileNavigation} variant="ghost">
        <MenuIcon className="size-5" />
      </IconButton>
    </header>
  );
}

function MobileNavigationDrawer({
  activeItem,
  operatorRole,
  settingsActive,
  status,
  navigationTrigger,
}: Omit<DashboardShellProps, "children"> & { navigationTrigger: RefObject<HTMLButtonElement | null> }) {
  const isMobileNavigationOpen = useAppUiStore((state) => state.isMobileNavigationOpen);
  const closeMobileNavigation = useAppUiStore((state) => state.closeMobileNavigation);
  const shell = useTranslations("dashboard.shell");

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) closeMobileNavigation(); };
    closeOnDesktop();
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [closeMobileNavigation]);

  return (
    <Drawer open={isMobileNavigationOpen} onOpenChange={open => { if (!open) closeMobileNavigation(); }}>
      <DrawerContent id="store-navigation" side="left" className="w-72 max-w-[calc(100vw-2rem)] lg:hidden" aria-describedby={undefined} onCloseAutoFocus={event => { event.preventDefault(); navigationTrigger.current?.focus(); }}>
      <DrawerHeader className="min-h-[var(--sf-header-height)] items-center px-3 py-2">
        <DrawerTitle className="text-sm">{shell("navigationTitle")}</DrawerTitle>
        <DrawerCloseButton aria-label={shell("closeNavigation")} />
      </DrawerHeader>
      <StoreSidebar
        activeItem={activeItem}
        className="min-h-0 h-auto w-full flex-1 border-r-0"
        operatorRole={operatorRole}
        settingsActive={settingsActive}
        status={status}
      />
      </DrawerContent>
    </Drawer>
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
  const navigationTrigger = useRef<HTMLButtonElement>(null);
  return (
    <main className="min-h-screen max-w-full overflow-x-clip bg-background text-foreground">
      <MobileNavigationDrawer
        activeItem={activeItem}
        operatorRole={operatorRole}
        settingsActive={settingsActive}
        status={status}
        navigationTrigger={navigationTrigger}
      />
      <div className="flex min-h-screen min-w-0 max-w-full items-stretch overflow-x-clip">
        <StoreSidebar
          rail
          activeItem={activeItem}
          className="sticky top-0 hidden h-screen lg:flex"
          operatorRole={operatorRole}
          settingsActive={settingsActive}
          status={status}
        />
        <div className="min-w-0 max-w-full flex-1">
        <WorkspaceHeader navigationTrigger={navigationTrigger} />
        <section className="grid min-w-0 max-w-full content-start gap-3 overflow-x-clip p-[var(--sf-page-gutter)]">
          <PageLayout>{contextToolbar}{children}</PageLayout>
        </section>
        </div>
      </div>
    </main>
  );
}
