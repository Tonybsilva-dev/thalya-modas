"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  IconButton,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  cn,
} from "@thalya-modas/ui";

import { useAppUiStore } from "@/src/shared/state/app-ui-store";
import { BrandMark } from "@/src/shared/ui/brand-mark";

import {
  BoxIcon,
  InfoIcon,
  ChartIcon,
  ClockIcon,
  GearIcon,
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

function StoreSidebar({
  activeItem,
  className,
  operatorRole,
  settingsActive,
  status,
}: Omit<DashboardShellProps, "children"> & { className?: string }) {
  const basePath = useDashboardBasePath();
  const closeMobileNavigation = useAppUiStore((state) => state.closeMobileNavigation);

  return (
    <Sidebar className={cn("shrink-0", className)}>
      <SidebarHeader className="grid gap-4">
        <BrandMark />
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
                {item.label}
              </Link>
            </SidebarItem>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="flex items-center gap-3 p-6">
        <div className="flex size-9 items-center justify-center bg-muted text-sm font-semibold text-foreground">
          AR
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">Ana Ribeiro</p>
          <p className="truncate text-xs text-muted-foreground">{operatorRole}</p>
        </div>
        <IconButton
          aria-label="Open settings"
          asChild
          className={cn(
            "size-9 bg-muted text-muted-foreground",
            settingsActive && "bg-sidebar-accent text-sidebar-accent-foreground",
          )}
          variant="ghost"
        >
          <Link href={`${basePath}/settings`}>
            <GearIcon className="size-4" />
          </Link>
        </IconButton>
      </SidebarFooter>
    </Sidebar>
  );
}

function MobileHeader() {
  const toggleMobileNavigation = useAppUiStore((state) => state.toggleMobileNavigation);

  return (
    <div className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 lg:hidden">
      <BrandMark />
      <IconButton aria-label="Open navigation" onClick={toggleMobileNavigation} variant="ghost">
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

  if (!isMobileNavigationOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        aria-label="Close navigation"
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
