"use client";
import { SidebarNavigation } from "@/src/shared/ui/sidebar-navigation";
import { AccountQuickMenu } from "@/src/shared/ui/account-quick-menu";
import { Button, PageLayout, Drawer, DrawerCloseButton, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@store-flow/ui";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  List,
  ClockCounterClockwise,
  Buildings,
  ChartBar,
  GearSix,
  Stack,
  UsersThree,
} from "@phosphor-icons/react";
import type { CurrentUser } from "@/src/features/auth/session/application/current-user-api";
import { BrandMark } from "@/src/shared/ui/brand-mark";
const navigationGroups = [
  { label: "Operação", items: [
    { href: "/backoffice", label: "Visão geral", icon: ChartBar },
    { href: "/backoffice/tenants", label: "Empresas", icon: Buildings },
    { href: "/backoffice/users", label: "Usuários", icon: UsersThree },
  ] },
  { label: "Produto", items: [
    { href: "/backoffice/plans", label: "Planos", icon: Stack },
  ] },
  { label: "Plataforma", items: [
    { href: "/backoffice/audit", label: "Auditoria", icon: ClockCounterClockwise },
    { href: "/backoffice/settings", label: "Configurações", icon: GearSix },
  ] },
];
export function BackofficeShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  function renderNavigation(rail = false) {
    return (
      <SidebarContent className="min-h-0 overflow-y-auto px-2 py-4">
        <SidebarNavigation rail={rail} label="Administração da plataforma" onNavigate={() => setMobileOpen(false)} groups={navigationGroups.map(group => ({
          id: group.label,
          label: group.label,
          items: group.items.map(({ href, label, icon: Icon }) => ({
            href, label, icon: <Icon size={18} aria-hidden="true" className="shrink-0" />,
            active: href === "/backoffice" ? pathname === href : pathname.startsWith(`${href}/`) || pathname === href,
          })),
        }))} />
      </SidebarContent>
    );
  }
  function renderAccount() {
    return (
      <SidebarFooter className="p-4">
        <AccountQuickMenu compact basePath="/backoffice" operatorName={user.name} operatorRole="Super administrador" platform settingsActive={pathname.startsWith("/backoffice/settings")} onNavigate={() => setMobileOpen(false)} />
      </SidebarFooter>
    );
  }
  return (
    <div className="super-admin-ui flex min-h-dvh flex-col bg-background lg:flex-row">
      <a href="#backoffice-content" className="sr-only z-50 bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Pular para o conteúdo
      </a>
      <Sidebar className="sticky top-0 hidden h-dvh shrink-0 lg:flex">
        <SidebarHeader className="flex min-h-[var(--sf-header-height)] shrink-0 items-center px-4 py-2">
          <BrandMark compact context="Administração da plataforma" />
        </SidebarHeader>
        {renderNavigation(true)}
        {renderAccount()}
      </Sidebar>
      <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
        <DrawerContent side="left" className="super-admin-ui w-72 p-0" aria-describedby="backoffice-menu-description">
          <DrawerHeader className="items-center">
            <div>
              <DrawerTitle>Store Flow</DrawerTitle>
              <DrawerDescription id="backoffice-menu-description">Administração da plataforma</DrawerDescription>
            </div>
            <DrawerCloseButton aria-label="Fechar menu" />
          </DrawerHeader>
          {renderNavigation()}
          {renderAccount()}
        </DrawerContent>
      </Drawer>
      <div className="min-w-0 flex-1">
        <header className="flex min-h-[var(--sf-header-height)] items-center justify-between gap-3 border-b bg-card px-4 py-2">
          <Button variant="ghost" className="min-w-11 lg:hidden" aria-label="Abrir menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>
            <List size={22} aria-hidden="true" />
          </Button>
          <div>
            <p className="text-base font-medium">Administração da plataforma</p>
            <p className="mt-1 text-xs text-muted-foreground">Store Flow</p>
          </div>
          <nav aria-label="Acessos da plataforma" className="hidden min-w-0 flex-1 items-center justify-center gap-2 xl:flex">
            {[['/backoffice/tenants','Empresas'],['/backoffice/users','Usuários'],['/backoffice/plans','Planos']].map(([href,label]) => <Link key={href} href={href} className="rounded-full border border-border bg-background px-4 py-2 text-xs hover:bg-accent">{label}</Link>)}
          </nav>
          <span className="hidden text-sm text-muted-foreground md:inline">
            {user.email}
          </span>
        </header>
        <main
          id="backoffice-content"
          tabIndex={-1}
          className="w-full min-w-0 p-[var(--sf-page-gutter)]"
        >
          <PageLayout>{children}</PageLayout>
        </main>
      </div>
    </div>
  );
}
