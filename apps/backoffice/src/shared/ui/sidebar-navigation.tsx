"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, SidebarItem, Tooltip, cn } from "@store-flow/ui";

type NavigationGroup = {
  id: string;
  label: string;
  items: { href: string; label: string; icon: ReactNode; active: boolean }[];
};

export function SidebarNavigation({ groups, label, onNavigate, rail = false }: {
  groups: NavigationGroup[];
  label: string;
  onNavigate: () => void;
  rail?: boolean;
}) {
  const pathname = usePathname();
  const activeGroup = groups.find(group => group.items.some(item => item.active))?.id;
  if (rail) return <nav aria-label={label} className="grid justify-items-center gap-5">
    {groups.map(group => <div key={group.id} role="group" aria-label={group.label} className="grid gap-2">
      {group.items.map(item => <Tooltip key={item.href} asChild placement="right" title={item.label}>
        <Link href={item.href} onClick={onNavigate} aria-label={item.label} aria-current={item.active ? "page" : undefined}
          className={cn("flex size-12 items-center justify-center rounded-full text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&_svg]:size-5", item.active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground")}>
          {item.icon}
        </Link>
      </Tooltip>)}
    </div>)}
  </nav>;
  return <nav aria-label={label}>
    <Accordion key={pathname} type="single" collapsible defaultValue={activeGroup} className="gap-1">
      {groups.map(group => <AccordionItem key={group.id} value={group.id} className="border-0 data-[state=open]:pb-2">
        <AccordionTrigger className={cn("min-h-10 gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:no-underline focus-visible:ring-2 focus-visible:ring-sidebar-ring", group.id === activeGroup && "text-foreground")}>
          {group.label}
        </AccordionTrigger>
        <AccordionContent className="h-auto w-full px-0 pb-0 pt-1 [&_a]:no-underline [&_a]:hover:no-underline">
          <div className="grid w-full gap-1">
            {group.items.map(item => <SidebarItem key={item.href} asChild active={item.active} className="min-h-10 w-full justify-start gap-3 px-3 text-sm font-normal [@media(pointer:coarse)]:min-h-11">
              <Link href={item.href} aria-current={item.active ? "page" : undefined} onClick={onNavigate} className="no-underline">
                {item.icon}<span className="min-w-0 flex-1 text-left">{item.label}</span>
              </Link>
            </SidebarItem>)}
          </div>
        </AccordionContent>
      </AccordionItem>)}
    </Accordion>
  </nav>;
}
